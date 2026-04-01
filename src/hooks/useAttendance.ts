
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

    // 3. Build HashMap for O(1) record lookup instead of O(n) find per student
    const recordMap = new Map<string, AttendanceRecord>();
    typedRecords.forEach(r => recordMap.set(r.enrollment_id, r));

    // 4. Merge (Don't filter - show all students in the class)
    return students.map((student) => {
      const record = recordMap.get(student.id);
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
      const recentSessionSet = new Set(recentSessionIds);

      // 4. Pre-index records by enrollment_id using a HashMap for O(1) grouping
      const recordsByEnrollment = new Map<string, AttendanceRecord[]>();
      for (const r of typedRecords) {
        const arr = recordsByEnrollment.get(r.enrollment_id);
        if (arr) {
          arr.push(r);
        } else {
          recordsByEnrollment.set(r.enrollment_id, [r]);
        }
      }

      // 5. Process each student with single-pass counting
      return students.map(student => {
        const studentRecords = recordsByEnrollment.get(student.id) || [];

        // Single-pass: count statuses + recent stats + build session lookup for trends
        let present = 0, late = 0, absent = 0, excused = 0;
        let recentPositive = 0, recentTotal = 0;
        const sessionStatusMap = new Map<string, AttendanceStatus>();

        for (const r of studentRecords) {
          // Count by status
          switch (r.status) {
            case 'present': present++; break;
            case 'late': late++; break;
            case 'absent': absent++; break;
            case 'excused': excused++; break;
          }
          // Track recent session stats
          if (recentSessionSet.has(r.session_id)) {
            recentTotal++;
            if (r.status === 'present' || r.status === 'late') recentPositive++;
            sessionStatusMap.set(r.session_id, r.status);
          }
        }

        const total = studentRecords.length;
        const percentage = total > 0
          ? Math.round(((present + late) / total) * 100)
          : 0;

        // Calculate Trend (Statuses of last 5 sessions) using the pre-built map
        const trend = recentSessionIds.map(sessionId => {
          return sessionStatusMap.get(sessionId) || null;
        }).reverse(); // Order from oldest to newest for graph

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
      const sessionQuery = supabase
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

      // 4. Build HashMap for O(1) session record lookup
      const recordMap = new Map<string, typeof attendanceRecords[0]>();
      (attendanceRecords || []).forEach(r => recordMap.set(r.session_id, r));

      // 5. Merge sessions with records using HashMap lookup
      return (sessions || []).map(session => {
        const record = recordMap.get(session.id);
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

  // Single-pass stats computation instead of 6× array scans
  const stats = records ? (() => {
    let marked = 0, present = 0, absent = 0, late = 0, excused = 0;
    for (const r of records) {
      if (r.status !== 'pending') {
        marked++;
        switch (r.status) {
          case 'present': present++; break;
          case 'absent': absent++; break;
          case 'late': late++; break;
          case 'excused': excused++; break;
        }
      }
    }
    return {
      total: records.length,
      marked,
      present,
      absent,
      late,
      excused,
      percentage: marked > 0
        ? Math.round(((present + late) / marked) * 100)
        : 0
    };
  })() : null;

  return {
    records,
    stats,
    isLoading,
    refetch,
  };
}
