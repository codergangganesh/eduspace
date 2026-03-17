
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceSession {
  id: string;
  class_id: string;
  created_by: string;
  title: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  class_id: string;
  enrollment_id: string; // FK to class_students.id
  student_id: string | null; // FK to auth.users.id
  status: AttendanceStatus;
  marked_by: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentAttendanceDetail {
  enrollment_id: string; // From class_students.id (works even if user is not registered)
  student_id: string | null; // From auth.users.id (if they have joined)
  student_name: string;
  register_number: string;
  profile_image: string | null;
  status: AttendanceStatus;
  remarks: string | null;
  record_id?: string;
}

export function useAttendance(classId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all attendance sessions for a class
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['attendance_sessions', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('class_id', classId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data as AttendanceSession[];
    },
    enabled: !!classId,
  });

  // Create a new session
  const createSession = useMutation({
    mutationFn: async (session: Partial<AttendanceSession>) => {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert([{ ...session, class_id: classId, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance_sessions', classId] });
      toast.success('Attendance session created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create session: ' + error.message);
    },
  });

  // Update a session
  const updateSession = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AttendanceSession> & { id: string }) => {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance_sessions', classId] });
      toast.success('Attendance session updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update session: ' + error.message);
    },
  });

  // Fetch students and their records for a specific session
  const fetchSessionRecords = async (sessionId: string) => {
    // 1. Fetch all students in the class
    const { data: students, error: studentsError } = await supabase
      .from('class_students')
      .select('*')
      .eq('class_id', classId);

    if (studentsError) throw studentsError;

    // 2. Fetch records for this session
    const { data: records, error: recordsError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId);

    if (recordsError) throw recordsError;

    const typedRecords = records as AttendanceRecord[];

    // 3. Merge (Don't filter - show all students in the class)
    return students.map((student) => {
      const record = typedRecords.find((r) => r.enrollment_id === student.id);
      return {
        enrollment_id: student.id,
        student_id: student.student_id || null,
        student_name: student.student_name,
        register_number: student.register_number,
        profile_image: student.student_image_url || null,
        status: (record?.status as AttendanceStatus) || 'present', // Default to present
        remarks: record?.remarks || null,
        record_id: record?.id,
      } as StudentAttendanceDetail;
    });
  };

  // Save attendance records in bulk
  const saveAttendance = useMutation({
    mutationFn: async ({ sessionId, records }: { sessionId: string; records: StudentAttendanceDetail[] }) => {
      const upserts = records.map((r) => ({
          session_id: sessionId,
          class_id: classId,
          enrollment_id: r.enrollment_id,
          student_id: r.student_id, // Might be null
          status: r.status,
          remarks: r.remarks,
          marked_by: user?.id,
          updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('attendance_records')
        .upsert(upserts, { onConflict: 'session_id, enrollment_id' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance_records', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['attendance_stats', classId] });
      toast.success('Attendance saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save attendance: ' + error.message);
    },
  });

  return {
    sessions,
    sessionsLoading,
    createSession,
    updateSession,
    fetchSessionRecords,
    saveAttendance,
    refetchSessions,
  };
}

export function useClassAttendanceStats(classId: string) {
  return useQuery({
    queryKey: ['class_attendance_stats', classId],
    queryFn: async () => {
      // 1. Fetch all students
      const { data: students, error: studentsError } = await supabase
        .from('class_students')
        .select('id, student_id, student_name, register_number, student_image_url')
        .eq('class_id', classId);

      if (studentsError) throw studentsError;

      // 2. Fetch all sessions for temporal context
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('id, session_date')
        .eq('class_id', classId)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      // 3. Fetch all records for this class
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('class_id', classId);

      if (recordsError) throw recordsError;

      const typedRecords = records as AttendanceRecord[];
      const recentSessionIds = sessions.slice(0, 5).map(s => s.id);

      // 4. Group by student (Show all students)
      return students.map(student => {
        const studentRecords = typedRecords.filter(r => r.enrollment_id === student.id);
        const total = studentRecords.length;
        const present = studentRecords.filter(r => r.status === 'present').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const excused = studentRecords.filter(r => r.status === 'excused').length;
        
        const percentage = total > 0 
          ? Math.round(((present + late) / total) * 100) 
          : 0;

        // Calculate Trend (Statuses of last 5 sessions)
        const trend = recentSessionIds.map(sessionId => {
          const record = studentRecords.find(r => r.session_id === sessionId);
          if (!record) return null;
          return record.status;
        }).reverse(); // Order from oldest to newest for graph

        // Predictive Risk Calculation: Drop in recent 5 sessions compared to overall
        const recentRecords = studentRecords.filter(r => recentSessionIds.includes(r.session_id));
        const recentTotal = recentRecords.length;
        const recentPositive = recentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        
        const recentPercentage = recentTotal > 0 
          ? Math.round((recentPositive / recentTotal) * 100) 
          : percentage;

        const percentageDrop = percentage - recentPercentage;

        return {
          enrollment_id: student.id,
          student_id: student.student_id,
          student_name: student.student_name,
          register_number: student.register_number,
          student_image_url: student.student_image_url,
          stats: { total, present, late, absent, excused, percentage },
          trends: {
            sparkline: trend,
            recentPercentage,
            percentageDrop: percentageDrop > 0 ? percentageDrop : 0,
            isFlagged: percentageDrop >= 10 && percentage >= 75 // Only flag if they were doing well but dropped
          }
        };
      });
    },
    enabled: !!classId,
  });
}

export function useStudentAttendance(classId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['student_attendance', user?.id, classId],
    queryFn: async () => {
      if (!user?.id || !user?.email) return [];

      // 1. Get all enrollments for this student (across all classes)
      // We look by UID first, then fall back to email for newly-joined students
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('id, class_id, email')
        .or(`student_id.eq.${user.id},email.eq.${user.email}`);

      if (enrollError) throw enrollError;
      if (!enrollments || enrollments.length === 0) return [];

      // Create maps for quick lookup 
      const enrollmentMap = new Map(enrollments.map(e => [e.class_id, e.id]));
      const enrolledClassIds = enrollments.map(e => e.class_id);

      // 2. Fetch all attendance sessions for the relevant classes (filtered by selection)
      let sessionQuery = supabase
        .from('attendance_sessions')
        .select('*')
        .in('class_id', classId ? [classId] : enrolledClassIds)
        .order('session_date', { ascending: false });

      const { data: sessions, error: sessionError } = await sessionQuery;
      if (sessionError) throw sessionError;

      // 3. Fetch all attendance records for this student's specific enrollments
      const targetEnrollmentIds = classId 
        ? enrollments.filter(e => e.class_id === classId).map(e => e.id)
        : enrollments.map(e => e.id);

      const { data: attendanceRecords, error: recordError } = await supabase
        .from('attendance_records')
        .select('*')
        .in('enrollment_id', targetEnrollmentIds);

      if (recordError) throw recordError;

      // 4. Merge sessions with records
      return (sessions || []).map(session => {
        const record = (attendanceRecords || []).find(r => r.session_id === session.id);
        return {
          ...record,
          id: record?.id || `virtual-${session.id}`,
          session_id: session.id,
          class_id: session.class_id,
          status: record?.status || 'pending',
          session: session,
          created_at: record?.created_at || session.created_at,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Real-time listener
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`student_attendance_v2_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records' },
        () => { refetch(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        () => { refetch(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const stats = records ? {
    total: records.length, // Count every session created as a potential record
    marked: records.filter(r => r.status !== 'pending').length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    excused: records.filter(r => r.status === 'excused').length,
    percentage: records.filter(r => r.status !== 'pending').length > 0 
      ? Math.round(((records.filter(r => r.status === 'present' || r.status === 'late').length) / records.filter(r => r.status !== 'pending').length) * 100)
      : 0
  } : null;

  return {
    records,
    stats,
    isLoading,
    refetch,
  };
}
