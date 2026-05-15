import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, Clock, Trophy, Target, ArrowLeft, Maximize2, ShieldAlert } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/layout/DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { QuizSkeleton } from '@/components/skeletons/QuizSkeleton';
import { notifyQuizSubmission } from '@/lib/notificationService';
import { useStreak } from '@/contexts/StreakContext';
import { knowledgeService } from '@/lib/knowledgeService';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IntegrityPopup } from '@/components/quizzes/IntegrityPopup';

type IntegrityEventType =
    | 'fullscreen_enter'
    | 'fullscreen_exit'
    | 'tab_switch'
    | 'refresh_attempt'
    | 'idle_period'
    | 'multi_session_access'
    | 'resume_attempt'
    | 'warning_shown'
    | 'question_change'
    | 'submit';

type ProgressSnapshot = {
    answers: Record<string, string>;
    currentIndex: number;
    elapsedTime: number;
    progressPercentage: number;
    questionDurations: Record<string, number>;
    updatedAt: string;
};

type IntegritySummary = {
    fullscreenExitCount: number;
    tabSwitchCount: number;
    refreshAttemptCount: number;
    idleCount: number;
    multiSessionAccessCount: number;
    suspiciousActivityCount: number;
    warningCount: number;
    questionDurations: Record<string, number>;
    completionBehavior: 'clean' | 'resumed' | 'submitted';
};

const IDLE_THRESHOLD_MS = 90_000;
const QUIZ_FULLSCREEN_MEDIA = '(min-width: 1024px) and (pointer: fine)';

const createDefaultIntegritySummary = (): IntegritySummary => ({
    fullscreenExitCount: 0,
    tabSwitchCount: 0,
    refreshAttemptCount: 0,
    idleCount: 0,
    multiSessionAccessCount: 0,
    suspiciousActivityCount: 0,
    warningCount: 0,
    questionDurations: {},
    completionBehavior: 'clean',
});

const parseStoredJson = <T,>(value: string | null, fallback: T): T => {
    if (!value) return fallback;

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
};

const buildDeviceFingerprint = () => {
    if (typeof window === 'undefined') return 'server';

    return [
        navigator.userAgent,
        navigator.language,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        window.screen.width,
        window.screen.height,
        window.devicePixelRatio,
    ].join('|');
};

export default function TakeQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user, profile, isLoading: authLoading } = useAuth();
    const userId = user?.id;

    const [quiz, setQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [rank, setRank] = useState<{ position: number, total: number } | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenPromptReason, setFullscreenPromptReason] = useState<'entry' | 'return'>('entry');
    const [integritySummary, setIntegritySummary] = useState<IntegritySummary>(createDefaultIntegritySummary);
    const [questionDurations, setQuestionDurations] = useState<Record<string, number>>({});
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const submissionIdRef = useRef<string | null>(null);
    const answersRef = useRef<Record<string, string>>({});
    const currentIndexRef = useRef(0);
    const elapsedTimeRef = useRef(0);
    const integritySummaryRef = useRef<IntegritySummary>(createDefaultIntegritySummary());
    const hasAttemptRecordedRef = useRef(false);
    const hasWarnedResumeRef = useRef(false);
    const quizShellRef = useRef<HTMLDivElement | null>(null);
    const quizContentRef = useRef<HTMLDivElement | null>(null);
    const questionDurationsRef = useRef<Record<string, number>>({});
    const currentQuestionIdRef = useRef<string | null>(null);
    const questionEnteredAtRef = useRef<number>(Date.now());
    const lastActivityAtRef = useRef<number>(Date.now());
    const idleLoggedRef = useRef(false);
    const visibilityLeaveRef = useRef(false);
    const warningToastAtRef = useRef(0);
    const fullscreenEnteredRef = useRef(false);
    const fullscreenStateRef = useRef(false);
    const saveProgressTimeoutRef = useRef<number | null>(null);
    const deviceFingerprintRef = useRef<string>(buildDeviceFingerprint());
    const fetchedAttemptKeyRef = useRef<string | null>(null);
    const isDesktopQuizMode = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(QUIZ_FULLSCREEN_MEDIA).matches;
    }, []);

    // LocalStorage keys for persistence
    const getStorageKey = useCallback(
        (key: string) => `quiz_${userId || 'anonymous'}_${quizId}_${key}`,
        [quizId, userId]
    );

    const handleBackNavigation = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate('/student/quizzes');
    };

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    useEffect(() => {
        elapsedTimeRef.current = elapsedTime;
    }, [elapsedTime]);

    useEffect(() => {
        integritySummaryRef.current = integritySummary;
    }, [integritySummary]);

    // Load saved quiz state from localStorage on mount
    useEffect(() => {
        if (!quizId || authLoading) return;

        const savedIndex = localStorage.getItem(getStorageKey('currentIndex'));
        const savedAnswers = localStorage.getItem(getStorageKey('answers'));
        const savedStartTime = localStorage.getItem(getStorageKey('startTime'));
        const savedSubmissionId = localStorage.getItem(getStorageKey('submissionId'));
        const savedQuestionDurations = localStorage.getItem(getStorageKey('questionDurations'));
        const savedIntegritySummary = localStorage.getItem(getStorageKey('integritySummary'));

        if (savedIndex !== null) {
            setCurrentIndex(parseInt(savedIndex, 10));
        }

        setAnswers(parseStoredJson<Record<string, string>>(savedAnswers, {}));
        const storedDurations = parseStoredJson<Record<string, number>>(savedQuestionDurations, {});
        questionDurationsRef.current = storedDurations;
        setQuestionDurations(storedDurations);
        setIntegritySummary({
            ...createDefaultIntegritySummary(),
            ...parseStoredJson<Partial<IntegritySummary>>(savedIntegritySummary, {}),
        });

        if (savedSubmissionId) {
            setSubmissionId(savedSubmissionId);
            submissionIdRef.current = savedSubmissionId;
        }

        // Initialize start time if not exists
        const startTimestamp = savedStartTime ? parseInt(savedStartTime, 10) : Date.now();
        startTimeRef.current = startTimestamp;
        setElapsedTime(Math.floor((Date.now() - startTimestamp) / 1000));
        if (!savedStartTime) {
            localStorage.setItem(getStorageKey('startTime'), startTimestamp.toString());
        }


        // Start timer — reads from ref so it can be reset mid-session
        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setElapsedTime(elapsed);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [authLoading, getStorageKey, quizId]);

    // Save in-progress state locally so refresh can resume smoothly
    useEffect(() => {
        if (authLoading) return;
        if (quizId && !result) {
            localStorage.setItem(getStorageKey('currentIndex'), currentIndex.toString());
            localStorage.setItem(getStorageKey('answers'), JSON.stringify(answers));
            localStorage.setItem(getStorageKey('questionDurations'), JSON.stringify(questionDurationsRef.current));
            localStorage.setItem(getStorageKey('integritySummary'), JSON.stringify({
                ...integritySummary,
                questionDurations: questionDurationsRef.current,
            }));
            if (submissionId) {
                localStorage.setItem(getStorageKey('submissionId'), submissionId);
            }
        }
    }, [answers, authLoading, currentIndex, getStorageKey, integritySummary, questionDurations, quizId, result, submissionId]);

    // Clear localStorage when quiz is submitted
    const clearQuizStorage = () => {
        if (quizId) {
            localStorage.removeItem(getStorageKey('currentIndex'));
            localStorage.removeItem(getStorageKey('startTime'));
            localStorage.removeItem(getStorageKey('answers'));
            localStorage.removeItem(getStorageKey('submissionId'));
            localStorage.removeItem(getStorageKey('questionDurations'));
            localStorage.removeItem(getStorageKey('integritySummary'));
            localStorage.removeItem(getStorageKey('pendingRefreshAttempt'));
        }
    };

    const saveAttemptSnapshot = useCallback((nextAnswers?: Record<string, string>, nextIndex?: number) => {
        if (!quizId) return;

        localStorage.setItem(getStorageKey('currentIndex'), (nextIndex ?? currentIndex).toString());
        localStorage.setItem(getStorageKey('answers'), JSON.stringify(nextAnswers ?? answers));
        localStorage.setItem(getStorageKey('questionDurations'), JSON.stringify(questionDurationsRef.current));
        localStorage.setItem(getStorageKey('integritySummary'), JSON.stringify({
            ...integritySummaryRef.current,
            questionDurations: questionDurationsRef.current,
        }));

        if (submissionIdRef.current) {
            localStorage.setItem(getStorageKey('submissionId'), submissionIdRef.current);
        }
    }, [answers, currentIndex, getStorageKey, quizId]);

    const markUserActive = useCallback(() => {
        lastActivityAtRef.current = Date.now();
        idleLoggedRef.current = false;
    }, []);

    const captureCurrentQuestionDuration = useCallback((questionId?: string) => {
        if (!questionId) return;

        const now = Date.now();
        const deltaSeconds = Math.max(0, Math.round((now - questionEnteredAtRef.current) / 1000));
        questionEnteredAtRef.current = now;

        if (deltaSeconds === 0) return;

        const nextDurations = {
            ...questionDurationsRef.current,
            [questionId]: (questionDurationsRef.current[questionId] || 0) + deltaSeconds,
        };
        questionDurationsRef.current = nextDurations;
        setQuestionDurations(nextDurations);
    }, []);

    const buildProgressSnapshot = useCallback((overrides?: Partial<ProgressSnapshot>): ProgressSnapshot => {
        const liveAnswers = overrides?.answers ?? answersRef.current;
        const liveQuestionCount = questions.length;
        return {
            answers: liveAnswers,
            currentIndex: overrides?.currentIndex ?? currentIndexRef.current,
            elapsedTime: overrides?.elapsedTime ?? elapsedTimeRef.current,
            progressPercentage: overrides?.progressPercentage ?? (liveQuestionCount ? Math.round((Object.keys(liveAnswers).length / liveQuestionCount) * 100) : 0),
            questionDurations: overrides?.questionDurations ?? questionDurationsRef.current,
            updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
        };
    }, [questions.length]);

    const persistSubmissionState = useCallback(async (payload?: {
        progressSnapshot?: ProgressSnapshot;
        integrity?: IntegritySummary;
        deviceFingerprint?: string;
        status?: string;
        submittedAt?: string;
        totalObtained?: number;
        timeTaken?: number;
        quizVersion?: number;
    }) => {
        const activeSubmissionId = submissionIdRef.current;
        if (!activeSubmissionId) return;

        const updatePayload: Record<string, unknown> = {
            progress_snapshot: payload?.progressSnapshot ?? buildProgressSnapshot(),
            integrity_summary: payload?.integrity ?? {
                ...integritySummaryRef.current,
                questionDurations: questionDurationsRef.current,
            },
            last_activity_at: new Date(lastActivityAtRef.current).toISOString(),
        };

        if (payload?.deviceFingerprint !== undefined) updatePayload.device_fingerprint = payload.deviceFingerprint;
        if (payload?.status !== undefined) updatePayload.status = payload.status;
        if (payload?.submittedAt !== undefined) updatePayload.submitted_at = payload.submittedAt;
        if (payload?.totalObtained !== undefined) updatePayload.total_obtained = payload.totalObtained;
        if (payload?.timeTaken !== undefined) updatePayload.time_taken = payload.timeTaken;
        if (payload?.quizVersion !== undefined) updatePayload.quiz_version = payload.quizVersion;

        const { error } = await supabase
            .from('quiz_submissions')
            .update(updatePayload as any)
            .eq('id', activeSubmissionId);

        if (error) {
            console.error('Failed to persist quiz state', error);
        }
    }, [buildProgressSnapshot]);

    const queueProgressSync = useCallback((overrides?: Partial<ProgressSnapshot>) => {
        if (!submissionIdRef.current) return;

        if (saveProgressTimeoutRef.current) {
            window.clearTimeout(saveProgressTimeoutRef.current);
        }

        saveProgressTimeoutRef.current = window.setTimeout(() => {
            persistSubmissionState({ progressSnapshot: buildProgressSnapshot(overrides) });
        }, 500);
    }, [buildProgressSnapshot, persistSubmissionState]);

    const updateIntegritySummary = useCallback((recipe: (current: IntegritySummary) => IntegritySummary) => {
        let nextSummary: IntegritySummary | null = null;
        setIntegritySummary((current) => {
            nextSummary = recipe(current);
            return nextSummary;
        });
        return nextSummary;
    }, []);

    const ensureActiveSubmission = useCallback(async () => {
        if (!quizId || !userId) {
            throw new Error('Quiz session is not ready yet.');
        }

        if (submissionIdRef.current) {
            return submissionIdRef.current;
        }

        const { data: existingSubmission, error: existingSubmissionError } = await supabase
            .from('quiz_submissions')
            .select('id, status')
            .eq('quiz_id', quizId)
            .eq('student_id', userId)
            .eq('is_archived', false)
            .maybeSingle();

        if (existingSubmissionError) {
            throw existingSubmissionError;
        }

        if (existingSubmission) {
            if (existingSubmission.status !== 'pending') {
                throw new Error('Quiz already submitted');
            }

            submissionIdRef.current = existingSubmission.id;
            setSubmissionId(existingSubmission.id);
            localStorage.setItem(getStorageKey('submissionId'), existingSubmission.id);
            return existingSubmission.id;
        }

        const { data: createdSubmission, error: createError } = await supabase
            .from('quiz_submissions')
            .insert({
                quiz_id: quizId,
                student_id: userId,
                total_obtained: 0,
                status: 'pending',
                quiz_version: quiz?.version || 1,
                started_at: new Date(startTimeRef.current).toISOString(),
                progress_snapshot: buildProgressSnapshot(),
                integrity_summary: {
                    ...integritySummaryRef.current,
                    questionDurations: questionDurationsRef.current,
                },
                last_activity_at: new Date().toISOString(),
                device_fingerprint: deviceFingerprintRef.current,
            })
            .select('id')
            .single();

        if (createError) {
            if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
                const { data: recoveredSubmission, error: recoveredError } = await supabase
                    .rpc('get_active_student_submission', {
                        p_quiz_id: quizId,
                        p_student_id: userId
                    });

                if (recoveredError) {
                    throw recoveredError;
                }

                const recovered = recoveredSubmission as any;
                if (!recovered?.id || recovered.status !== 'pending') {
                    throw new Error('Unable to recover active quiz submission.');
                }

                submissionIdRef.current = recovered.id;
                setSubmissionId(recovered.id);
                localStorage.setItem(getStorageKey('submissionId'), recovered.id);
                return recovered.id as string;
            }

            throw createError;
        }

        submissionIdRef.current = createdSubmission.id;
        setSubmissionId(createdSubmission.id);
        localStorage.setItem(getStorageKey('submissionId'), createdSubmission.id);
        return createdSubmission.id;
    }, [buildProgressSnapshot, getStorageKey, quiz?.version, quizId, userId]);

    const logIntegrityEvent = useCallback(async (eventType: IntegrityEventType, details: Record<string, unknown> = {}, nextSummary?: IntegritySummary) => {
        if (!quizId || !userId) return;

        try {
            const activeSubmissionId = await ensureActiveSubmission();
            await supabase.from('quiz_integrity_events').insert({
                submission_id: activeSubmissionId,
                quiz_id: quizId,
                student_id: userId,
                event_type: eventType,
                details,
            } as any);

            if (nextSummary) {
                await persistSubmissionState({ integrity: nextSummary });
            }
        } catch (error) {
            console.error(`Failed to log quiz event: ${eventType}`, error);
        }
    }, [ensureActiveSubmission, persistSubmissionState, quizId, userId]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const safeCurrentIndex = Math.min(currentIndex, Math.max(questions.length - 1, 0));
    const hasInProgressAttempt = !!quizId && !loading && !result && (!!submissionId || Object.keys(answers).length > 0 || questions.length > 0);
    const isDesktopFullscreenRequired = isDesktopQuizMode && !result;
    const isQuizInteractionBlocked = isDesktopFullscreenRequired && !isFullscreen;

    useEffect(() => {
        const fetchQuizData = async () => {
            if (authLoading || !quizId || !userId) return;

            const attemptKey = `${quizId}:${userId}`;
            if (fetchedAttemptKeyRef.current === attemptKey) {
                return;
            }

            try {
                fetchedAttemptKeyRef.current = attemptKey;
                setLoading(true);
                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*, classes(class_name)')
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                setQuiz(quizData);

                // Record academic action (Attempting a quiz)
                if (!hasAttemptRecordedRef.current) {
                    hasAttemptRecordedRef.current = true;
                    recordAcademicAction();
                }

                // Check for existing ACTIVE submission (pending or completed, but not archived)
                // This is the SINGLE SOURCE OF TRUTH for preventing reattempts
                let { data: submission } = await supabase
                    .from('quiz_submissions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('student_id', userId)
                    .eq('is_archived', false) // Use active submissions only
                    .order('submitted_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (submission?.started_at) {
                    const startedAt = new Date(submission.started_at).getTime();
                    if (!Number.isNaN(startedAt)) {
                        startTimeRef.current = startedAt;
                        setElapsedTime(Math.floor((Date.now() - startedAt) / 1000));
                        localStorage.setItem(getStorageKey('startTime'), startedAt.toString());
                    }
                }

                const serverSnapshot = (submission?.progress_snapshot || {}) as Partial<ProgressSnapshot>;
                if (typeof serverSnapshot.currentIndex === 'number' && localStorage.getItem(getStorageKey('currentIndex')) === null) {
                    setCurrentIndex(serverSnapshot.currentIndex);
                }
                if (serverSnapshot.questionDurations && Object.keys(serverSnapshot.questionDurations).length > 0) {
                    questionDurationsRef.current = Object.keys(questionDurationsRef.current).length > 0
                        ? questionDurationsRef.current
                        : serverSnapshot.questionDurations || {};
                    setQuestionDurations(questionDurationsRef.current);
                }

                const serverIntegrity = (submission?.integrity_summary || {}) as Partial<IntegritySummary>;
                if (Object.keys(serverIntegrity).length > 0) {
                    setIntegritySummary((prev) => ({
                        ...prev,
                        ...serverIntegrity,
                        questionDurations: serverIntegrity.questionDurations || prev.questionDurations,
                    }));
                }

                // If submission exists and is completed, load answers and show result view
                if (submission && submission.status !== 'pending') {
                    console.log('Quiz already completed. Loading answers for result view.');

                    // Fetch the student's saved answers so the review section works
                    const { data: savedAnswers } = await supabase
                        .from('quiz_answers')
                        .select('question_id, selected_option')
                        .eq('submission_id', submission.id);

                    if (savedAnswers) {
                        const loadedAnswers: Record<string, string> = {};
                        savedAnswers.forEach((a: any) => {
                            if (a.selected_option && a.selected_option !== 'skipped') {
                                loadedAnswers[a.question_id] = a.selected_option;
                            }
                        });
                        setAnswers(loadedAnswers);
                    }

                    // Also fetch questions so the review section can render
                    const { data: questionsData } = await supabase
                        .from('quiz_questions')
                        .select('*')
                        .eq('quiz_id', quizId)
                        .order('order_index');

                    if (questionsData) setQuestions(questionsData);

                    setResult(submission);
                    setLoading(false);
                    return;
                }

                // Check for version mismatch (Re-attempt Logic)
                if (submission && (submission.quiz_version || 1) < (quizData.version || 1)) {
                    console.log("Found outdated active submission. Archiving to allow re-take.");
                    // Archive the old submission
                    await supabase
                        .from('quiz_submissions')
                        .update({ is_archived: true })
                        .eq('id', submission.id);

                    // Clear saved quiz state and reset timer to 0
                    clearQuizStorage();
                    startTimeRef.current = Date.now();
                    localStorage.setItem(getStorageKey('startTime'), startTimeRef.current.toString());
                    setElapsedTime(0);
                    setCurrentIndex(0);

                    // Reset submission variable to trigger new creation
                    submission = null;
                }

                if (submission) {
                    setSubmissionId(submission.id);
                    submissionIdRef.current = submission.id;
                    if (submission.status === 'pending') {
                        setResult(null);
                        const { data: existingAnswers } = await supabase
                            .from('quiz_answers')
                            .select('question_id, selected_option')
                            .eq('submission_id', submission.id);

                        if (existingAnswers) {
                            const loadedAnswers: Record<string, string> = {};
                            existingAnswers.forEach((a: any) => {
                                if (a.selected_option && a.selected_option !== 'skipped') {
                                    loadedAnswers[a.question_id] = a.selected_option;
                                }
                            });
                            setAnswers(loadedAnswers);
                            if (!hasWarnedResumeRef.current) {
                                toast.info('Resuming your quiz attempt');
                                hasWarnedResumeRef.current = true;
                            }
                        }

                        if (submission.device_fingerprint && submission.device_fingerprint !== deviceFingerprintRef.current) {
                            const nextSummary = updateIntegritySummary((current) => ({
                                ...current,
                                multiSessionAccessCount: current.multiSessionAccessCount + 1,
                                suspiciousActivityCount: current.suspiciousActivityCount + 1,
                                completionBehavior: 'resumed',
                            }));
                            if (nextSummary) {
                                await logIntegrityEvent('multi_session_access', {
                                    previousFingerprint: submission.device_fingerprint,
                                    currentFingerprint: deviceFingerprintRef.current,
                                }, nextSummary);
                            }
                        } else if (!submission.device_fingerprint) {
                            await persistSubmissionState({ deviceFingerprint: deviceFingerprintRef.current });
                        }

                        if (localStorage.getItem(getStorageKey('pendingRefreshAttempt'))) {
                            localStorage.removeItem(getStorageKey('pendingRefreshAttempt'));
                            const nextSummary = updateIntegritySummary((current) => ({
                                ...current,
                                refreshAttemptCount: current.refreshAttemptCount + 1,
                                suspiciousActivityCount: current.suspiciousActivityCount + 1,
                                completionBehavior: 'resumed',
                            }));
                            if (nextSummary) {
                                await logIntegrityEvent('refresh_attempt', {
                                    restoredAt: new Date().toISOString(),
                                }, nextSummary);
                            }
                        }
                    } else {
                        // Submission is already completed (passed/failed) - REDIRECT TO RESULTS
                        console.log('Quiz already completed. Redirecting to results page.');
                        navigate(`/student/quizzes/${quizId}/details`);
                        return;
                    }
                }

                // Create new submission if none exists (or if we just archived the outdated one)
                if (!submission) {
                    // Try to create only if we didn't find one
                    const { data: newSubmission, error: createError } = await supabase
                        .from('quiz_submissions')
                        .insert({
                            quiz_id: quizId,
                            student_id: userId,
                            total_obtained: 0,
                            status: 'pending',
                            quiz_version: quizData.version,
                            started_at: new Date(startTimeRef.current).toISOString(),
                            progress_snapshot: buildProgressSnapshot(),
                            integrity_summary: {
                                ...integritySummaryRef.current,
                                questionDurations: questionDurationsRef.current,
                            },
                            last_activity_at: new Date().toISOString(),
                            device_fingerprint: deviceFingerprintRef.current,
                        })
                        .select()
                        .single();

                    if (createError) {
                        // Handle unique constraint violation (race condition or filter mismatch)
                        if (createError.code === '23505') {
                            console.log('Found existing submission via uniqueness constraint, recovering...');
                            const { data: recoveredSub } = await supabase
                                .from('quiz_submissions')
                                .select('*')
                                .eq('quiz_id', quizId)
                                .eq('student_id', userId)
                                .eq('status', 'pending')
                                .maybeSingle();

                            if (recoveredSub) {
                                setSubmissionId(recoveredSub.id);
                                submissionIdRef.current = recoveredSub.id;
                                // Should load answers here too technically, but usually new/empty
                            }
                        } else {
                            console.error('Error creating pending submission', createError);
                        }
                    } else if (newSubmission) {
                        setSubmissionId(newSubmission.id);
                        submissionIdRef.current = newSubmission.id;
                    }
                }

                const { data: questionsData, error: questionsError } = await supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('order_index');

                if (questionsError) throw questionsError;
                setQuestions(questionsData || []);

            } catch (error: any) {
                fetchedAttemptKeyRef.current = null;
                console.error('Error loading quiz:', JSON.stringify(error, null, 2));
                toast.error(`Failed to load quiz: ${error.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();
    }, [authLoading, buildProgressSnapshot, getStorageKey, logIntegrityEvent, persistSubmissionState, quizId, updateIntegritySummary, userId]);

    useEffect(() => {
        if (result && quizId) {
            const fetchRank = async () => {
                try {
                    const { count: higherScoresCount } = await supabase
                        .from('quiz_submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('quiz_id', quizId)
                        .gt('total_obtained', result.total_obtained);

                    const { count: totalSubmissions } = await supabase
                        .from('quiz_submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('quiz_id', quizId);

                    if (higherScoresCount !== null && totalSubmissions !== null) {
                        setRank({
                            position: higherScoresCount + 1,
                            total: totalSubmissions
                        });
                    }
                } catch (e) {
                    console.error("Error fetching rank", e);
                }
            };
            fetchRank();
        }
    }, [result, quizId]);

    useEffect(() => {
        if (!questions[safeCurrentIndex]?.id || result) return;

        const previousQuestionId = currentQuestionIdRef.current;
        if (previousQuestionId) {
            captureCurrentQuestionDuration(previousQuestionId);
        }
        currentQuestionIdRef.current = questions[safeCurrentIndex]?.id;
        questionEnteredAtRef.current = Date.now();
        markUserActive();

        const nextSummary = updateIntegritySummary((current) => ({
            ...current,
            questionDurations,
        }));

        queueProgressSync({
            currentIndex: safeCurrentIndex,
            questionDurations,
        });

        if (nextSummary) {
            logIntegrityEvent('question_change', {
                currentIndex: safeCurrentIndex,
                questionId: questions[safeCurrentIndex]?.id,
            }, nextSummary);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeCurrentIndex]);

    useEffect(() => {
        if (!hasInProgressAttempt || result) return;

        queueProgressSync();
    }, [answers, currentIndex, hasInProgressAttempt, queueProgressSync, questionDurations, result]);

    useEffect(() => {
        if (!hasInProgressAttempt || result) return;

        const handleActivity = () => markUserActive();
        const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
        activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));

        const idleInterval = window.setInterval(() => {
            if (Date.now() - lastActivityAtRef.current < IDLE_THRESHOLD_MS || idleLoggedRef.current) return;

            idleLoggedRef.current = true;
            const nextSummary = updateIntegritySummary((current) => ({
                ...current,
                idleCount: current.idleCount + 1,
                suspiciousActivityCount: current.suspiciousActivityCount + 1,
            }));

            if (nextSummary) {
                toast.warning('You have been inactive for a while. Quiz activity may be reviewed.');
                logIntegrityEvent('idle_period', {
                    idleForSeconds: Math.round((Date.now() - lastActivityAtRef.current) / 1000),
                }, nextSummary);
            }
        }, 15000);

        return () => {
            activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
            window.clearInterval(idleInterval);
        };
    }, [hasInProgressAttempt, logIntegrityEvent, markUserActive, result, updateIntegritySummary]);

    useEffect(() => {
        if (!hasInProgressAttempt || result) return;

        const emitWindowLeave = () => {
            if (visibilityLeaveRef.current) return;
            visibilityLeaveRef.current = true;

            const now = Date.now();
            if (now - warningToastAtRef.current > 5000) {
                toast.warning('Leaving the quiz window may be recorded.');
                warningToastAtRef.current = now;
            }

            const nextSummary = updateIntegritySummary((current) => ({
                ...current,
                tabSwitchCount: current.tabSwitchCount + 1,
                suspiciousActivityCount: current.suspiciousActivityCount + 1,
                warningCount: current.warningCount + 1,
            }));

            if (nextSummary) {
                logIntegrityEvent('tab_switch', {
                    hidden: document.visibilityState === 'hidden',
                }, nextSummary);
            }
        };

        const resetWindowLeave = () => {
            visibilityLeaveRef.current = false;
            markUserActive();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                emitWindowLeave();
                return;
            }

            resetWindowLeave();
        };

        const handleBlur = () => emitWindowLeave();
        const handleFocus = () => resetWindowLeave();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [hasInProgressAttempt, logIntegrityEvent, markUserActive, result, updateIntegritySummary]);

    useEffect(() => {
        if (!hasInProgressAttempt || result || !isDesktopQuizMode) return;

        const syncFullscreenState = () => {
            const active = document.fullscreenElement === quizShellRef.current;
            if (fullscreenStateRef.current === active) {
                return;
            }

            fullscreenStateRef.current = active;
            setIsFullscreen(active);

            if (active) {
                fullscreenEnteredRef.current = true;
                markUserActive();
                logIntegrityEvent('fullscreen_enter', {
                    enteredAt: new Date().toISOString(),
                });
                return;
            }

            if (fullscreenEnteredRef.current) {
                setFullscreenPromptReason('return');
                const nextSummary = updateIntegritySummary((current) => ({
                    ...current,
                    fullscreenExitCount: current.fullscreenExitCount + 1,
                    suspiciousActivityCount: current.suspiciousActivityCount + 1,
                    warningCount: current.warningCount + 1,
                }));

                if (nextSummary) {
                    logIntegrityEvent('fullscreen_exit', {
                        exitedAt: new Date().toISOString(),
                    }, nextSummary);
                    logIntegrityEvent('warning_shown', {
                        warning: 'fullscreen_exit',
                    }, nextSummary);
                }
            } else {
                setFullscreenPromptReason('entry');
            }
        };

        document.addEventListener('fullscreenchange', syncFullscreenState);
        syncFullscreenState();

        return () => {
            document.removeEventListener('fullscreenchange', syncFullscreenState);
        };
    }, [hasInProgressAttempt, isDesktopQuizMode, logIntegrityEvent, markUserActive, result, updateIntegritySummary]);

    useEffect(() => {
        if (!hasInProgressAttempt || result) return;

        const container = quizContentRef.current;
        if (!container) return;

        const shouldBlock = (target: EventTarget | null) => target instanceof Node && container.contains(target);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!shouldBlock(event.target)) return;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
                event.preventDefault();
            }
        };

        const preventDefault = (event: Event) => {
            if (!shouldBlock(event.target)) return;
            event.preventDefault();
        };

        document.addEventListener('keydown', handleKeyDown);
        container.addEventListener('copy', preventDefault);
        container.addEventListener('contextmenu', preventDefault);
        container.addEventListener('selectstart', preventDefault);
        container.addEventListener('dragstart', preventDefault);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            container.removeEventListener('copy', preventDefault);
            container.removeEventListener('contextmenu', preventDefault);
            container.removeEventListener('selectstart', preventDefault);
            container.removeEventListener('dragstart', preventDefault);
        };
    }, [hasInProgressAttempt, result]);

    useEffect(() => () => {
        if (saveProgressTimeoutRef.current) {
            window.clearTimeout(saveProgressTimeoutRef.current);
        }
    }, []);

    const handleAnswerChange = async (questionId: string, optionId: string) => {
        if (answers[questionId] === optionId) return;
        const nextAnswers = { ...answers, [questionId]: optionId };
        markUserActive();
        setAnswers(nextAnswers);
        saveAttemptSnapshot(nextAnswers);
        queueProgressSync({ answers: nextAnswers });

        try {
            const activeSubmissionId = await ensureActiveSubmission();
            const { data: existingAnswerRow, error: existingAnswerError } = await supabase
                .from('quiz_answers')
                .select('id')
                .eq('submission_id', activeSubmissionId)
                .eq('question_id', questionId)
                .maybeSingle();

            if (existingAnswerError) throw existingAnswerError;

            if (existingAnswerRow?.id) {
                const { error } = await supabase
                    .from('quiz_answers')
                    .update({
                        selected_option: optionId,
                    })
                    .eq('id', existingAnswerRow.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('quiz_answers')
                    .insert({
                        submission_id: activeSubmissionId,
                        question_id: questionId,
                        selected_option: optionId,
                    });

                if (error) throw error;
            }
        } catch (error) {
            console.error("Error auto-saving answer", error);
            toast.error("We couldn't save that answer. Please try again.");
        }
    };

    const clearAnswer = async () => {
        const currentQuestion = questions[currentIndex];
        const existingAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
        if (currentQuestion && existingAnswer) {
            const newAnswers = { ...answers };
            delete newAnswers[currentQuestion.id];
            markUserActive();
            setAnswers(newAnswers);
            saveAttemptSnapshot(newAnswers);
            queueProgressSync({ answers: newAnswers });

            try {
                const activeSubmissionId = submissionIdRef.current ?? await ensureActiveSubmission();
                const { error } = await supabase
                    .from('quiz_answers')
                    .delete()
                    .eq('submission_id', activeSubmissionId)
                    .eq('question_id', currentQuestion.id);

                if (error) {
                    throw error;
                }
            } catch (error) {
                console.error("Error clearing saved answer", error);
                const restoredAnswers = { ...newAnswers, [currentQuestion.id]: existingAnswer };
                setAnswers(restoredAnswers);
                saveAttemptSnapshot(restoredAnswers);
                toast.error("Failed to clear answer");
            }
        }
    };

    useEffect(() => {
        if (authLoading || !quizId || !userId) return;

        const channel = supabase
            .channel(`take_quiz_${quizId}_${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'quiz_submissions', filter: `student_id=eq.${userId}` },
                (payload) => {
                    const record = (payload.new || payload.old) as any;
                    if (record?.quiz_id !== quizId) return;

                    if (payload.eventType === 'DELETE') {
                        setSubmissionId(null);
                        submissionIdRef.current = null;
                        localStorage.removeItem(getStorageKey('submissionId'));
                        return;
                    }

                    if (payload.new && (payload.new as any).id) {
                        const nextSubmissionId = (payload.new as any).id as string;
                        setSubmissionId(nextSubmissionId);
                        submissionIdRef.current = nextSubmissionId;
                        localStorage.setItem(getStorageKey('submissionId'), nextSubmissionId);
                    }

                    if ((payload.new as any)?.status && (payload.new as any).status !== 'pending') {
                        setResult(payload.new);
                        if (quizId) {
                            localStorage.removeItem(getStorageKey('currentIndex'));
                            localStorage.removeItem(getStorageKey('startTime'));
                            localStorage.removeItem(getStorageKey('answers'));
                            localStorage.removeItem(getStorageKey('submissionId'));
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'quiz_answers' },
                (payload) => {
                    const activeSubmissionId = submissionIdRef.current;
                    const record = (payload.new || payload.old) as any;

                    if (!activeSubmissionId || record?.submission_id !== activeSubmissionId) return;

                    if (payload.eventType === 'DELETE' || record?.selected_option === 'skipped') {
                        setAnswers((prev) => {
                            if (!(record.question_id in prev)) {
                                return prev;
                            }
                            const next = { ...prev };
                            delete next[record.question_id];
                            return next;
                        });
                        return;
                    }

                    if (record?.question_id && record?.selected_option) {
                        setAnswers((prev) => {
                            if (prev[record.question_id] === record.selected_option) {
                                return prev;
                            }

                            return {
                                ...prev,
                                [record.question_id]: record.selected_option,
                            };
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [authLoading, getStorageKey, quizId, userId]);

    const { recordAcademicAction } = useStreak();

    const handleSubmit = async () => {
        if (!userId || !quiz) return;
        setIsConfirmSubmitOpen(false);
        captureCurrentQuestionDuration(questions[safeCurrentIndex]?.id);
        markUserActive();

        // Record academic action (Submitting a quiz)
        await recordAcademicAction();
        if (result || (submissionId && !answers)) {
            toast.error("You have already submitted this quiz.");
            navigate(`/student/quizzes/${quizId}/details`);
            return;
        }

        setSubmitting(true);
        try {
            // Ensure submissionId exists
            let activeSubmissionId = submissionId;

            if (!activeSubmissionId) {
                console.log("No active submission ID, checking for existing pending submission...");

                // 1. Check for existing pending submission first
                const { data: existingSub } = await supabase
                    .from('quiz_submissions')
                    .select('id')
                    .eq('quiz_id', quizId)
                    .eq('student_id', userId)
                    .eq('status', 'pending')
                    .maybeSingle();

                if (existingSub) {
                    console.log("Found existing pending submission:", existingSub.id);
                    activeSubmissionId = existingSub.id;
                    setSubmissionId(existingSub.id);
                    submissionIdRef.current = existingSub.id;
                } else {
                    // 2. Only create if no pending submission exists
                    console.log("No pending submission found, creating new one...");
                    const { data: newSub, error: createError } = await supabase
                        .from('quiz_submissions')
                        .insert({
                            quiz_id: quizId,
                            student_id: userId,
                            total_obtained: 0,
                            status: 'pending',
                            quiz_version: quiz.version || 1,
                            started_at: new Date(startTimeRef.current).toISOString(),
                            progress_snapshot: buildProgressSnapshot(),
                            integrity_summary: { ...integritySummary, questionDurations },
                            last_activity_at: new Date().toISOString(),
                            device_fingerprint: deviceFingerprintRef.current,
                        })
                        .select()
                        .single();

                    if (createError) {
                        if (createError.code === '23505' || createError.message?.includes('duplicate key')) { // Unique violation code or message check
                            console.log('Duplicate key error detected. Attempting recovery via RPC...', { quizId, userId });

                            // Use RPC to bypass RLS and find the exact active submission
                            const { data: rpcResult, error: rpcError } = await supabase
                                .rpc('get_active_student_submission', {
                                    p_quiz_id: quizId,
                                    p_student_id: userId
                                });

                            console.log('RPC Recovery Query Result:', { rpcResult, rpcError });

                            const retrySub = rpcResult as any;

                            if (retrySub) {
                                if (retrySub.status !== 'pending') {
                                    setResult(retrySub);
                                    toast.info('Quiz already submitted');
                                    return;
                                }
                                activeSubmissionId = retrySub.id;
                                setSubmissionId(retrySub.id);
                                submissionIdRef.current = retrySub.id;
                            } else {
                                console.error('Recovery failed: Active submission not found via RPC', rpcResult);
                                throw new Error(`Failed to create submission: Duplicate detected but active submission not found via RPC. IDs: Q=${quizId}, U=${userId}`);
                            }
                        } else {
                            throw new Error(`Failed to create submission: ${createError.message}`);
                        }
                    } else {
                        activeSubmissionId = newSub.id;
                        setSubmissionId(newSub.id);
                        submissionIdRef.current = newSub.id;
                    }
                }
            }

            let score = 0;
            const answersToInsert: any[] = [];

            questions.forEach(q => {
                const selected = answers[q.id];
                const isCorrect = selected === q.correct_answer;
                if (isCorrect) score += q.marks;

                answersToInsert.push({
                    submission_id: activeSubmissionId,
                    question_id: q.id,
                    selected_option: selected || 'skipped',
                    correct_option_id: q.correct_answer,
                    is_correct: isCorrect
                });
            });

            const percentage = (score / quiz.total_marks) * 100;
            const status = percentage >= quiz.pass_percentage ? 'passed' : 'failed';
            const finalQuestionDurations = {
                ...questionDurationsRef.current,
            };
            const finalIntegritySummary: IntegritySummary = {
                ...integritySummary,
                questionDurations: finalQuestionDurations,
                completionBehavior: integritySummary.completionBehavior === 'clean' ? 'submitted' : integritySummary.completionBehavior,
            };
            const finalProgressSnapshot = buildProgressSnapshot({
                answers,
                currentIndex: safeCurrentIndex,
                elapsedTime,
                progressPercentage: 100,
                questionDurations: finalQuestionDurations,
            });

            // Delete old answers and insert new ones
            const { error: deleteError } = await supabase.from('quiz_answers').delete().eq('submission_id', activeSubmissionId);
            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase.from('quiz_answers').insert(answersToInsert);
            if (insertError) throw insertError;

            // Update submission status
            const { data: submissionData, error: subError } = await supabase
                .from('quiz_submissions')
                .update({
                    total_obtained: score,
                    status: status,
                    submitted_at: new Date().toISOString(),
                    time_taken: elapsedTime,
                    quiz_version: quiz.version || 1,
                    progress_snapshot: finalProgressSnapshot,
                    integrity_summary: finalIntegritySummary,
                    last_activity_at: new Date(lastActivityAtRef.current).toISOString(),
                    device_fingerprint: deviceFingerprintRef.current,
                })
                .eq('id', activeSubmissionId)
                .select()
                .single();

            if (subError) throw subError;

            await logIntegrityEvent('submit', {
                status,
                score,
                progressPercentage: 100,
            }, finalIntegritySummary);

            // Clear localStorage on successful submission
            clearQuizStorage();

            setResult(submissionData);
            if (timerRef.current) clearInterval(timerRef.current);
            toast.success('Quiz submitted successfully!');

            // Add to Knowledge Map
            knowledgeService.upsertKnowledgeNode({
                type: 'quiz',
                sourceId: submissionData.id,
                label: quiz.title,
                text: quiz.title
            });

            // Notify Lecturer
            if (quiz.created_by && profile?.full_name) {
                notifyQuizSubmission(
                    quiz.created_by,
                    profile.full_name,
                    quiz.title,
                    quiz.id,
                    quiz.class_id,
                    userId
                ).catch(err => console.error("Failed to notify lecturer:", err));
            }

        } catch (error: any) {
            console.error('Error submitting quiz:', error);
            toast.error(error.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAttemptSubmit = () => {
        const unansweredCount = questions.length - Object.keys(answers).length;
        if (unansweredCount > 0) {
            setIsConfirmSubmitOpen(true);
        } else {
            handleSubmit();
        }
    };

    const requestQuizFullscreen = useCallback(async () => {
        if (!isDesktopQuizMode || !quizShellRef.current) {
            return;
        }

        try {
            if (document.fullscreenElement === quizShellRef.current) {
                await document.exitFullscreen();
                return;
            }

            await quizShellRef.current.requestFullscreen();
        } catch (error) {
            console.error('Failed to enter fullscreen mode', error);
            toast.warning('Fullscreen could not be enabled. Please try again to continue the quiz.');
        }
    }, [isDesktopQuizMode]);

    useEffect(() => {
        if (questions.length === 0) return;
        if (currentIndex > questions.length - 1) {
            setCurrentIndex(questions.length - 1);
        }
    }, [currentIndex, questions.length]);

    useEffect(() => {
        if (!hasInProgressAttempt) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            captureCurrentQuestionDuration(questions[safeCurrentIndex]?.id);
            saveAttemptSnapshot();
            localStorage.setItem(getStorageKey('pendingRefreshAttempt'), new Date().toISOString());
            event.preventDefault();
            event.returnValue = "Refreshing the page may interrupt your current quiz attempt. If you continue, the quiz may restart from the beginning.";
        };

        const handlePageHide = () => {
            captureCurrentQuestionDuration(questions[safeCurrentIndex]?.id);
            saveAttemptSnapshot();
            queueProgressSync();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [captureCurrentQuestionDuration, getStorageKey, hasInProgressAttempt, questions, queueProgressSync, safeCurrentIndex, saveAttemptSnapshot]);


    if (loading) {
        return (
            <DashboardLayout fullHeight>
                <QuizSkeleton />
            </DashboardLayout>
        );
    }

    if (!quiz) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <XCircle className="size-16 text-destructive" />
                    <h2 className="text-2xl font-bold">Quiz Not Found</h2>
                    <Button onClick={() => navigate('/student/quizzes')}>Back to Quizzes</Button>
                </div>
            </DashboardLayout>
        );
    }

    // ==================== RESULT VIEW ====================
    if (result) {
        const percentage = Math.round((result.total_obtained / quiz.total_marks) * 100);
        const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length;

        return (
            <DashboardLayout fullHeight>
                <div className="h-full bg-[#0A0C14] text-white overflow-y-auto selection:bg-blue-500/30">
                    <div className="max-w-6xl mx-auto p-4 lg:p-10 space-y-10 pb-20">

                        {/* 1. Results Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Trophy className="size-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">Results</span>
                                    </div>
                                    <h1 className="text-xl font-bold text-slate-100">{quiz.title}</h1>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/student/quizzes')}
                                className="bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl gap-2 font-bold"
                            >
                                <XCircle className="size-4" />
                                Exit
                            </Button>
                        </div>

                        {/* 2. Main Performance Card */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[32px] blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                            <div className="relative bg-[#111420] border border-white/5 rounded-[32px] p-8 lg:p-12 overflow-hidden">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                                    {/* Left: Score Gauge */}
                                    <div className="lg:col-span-4 flex justify-center">
                                        <div className="relative size-56">
                                            <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
                                                <circle
                                                    className="text-slate-800"
                                                    strokeWidth="8"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="42"
                                                    cx="50"
                                                    cy="50"
                                                />
                                                <circle
                                                    className="text-blue-500 transition-all duration-1000 ease-out"
                                                    strokeWidth="8"
                                                    strokeDasharray={264}
                                                    strokeDashoffset={264 - (264 * percentage) / 100}
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="42"
                                                    cx="50"
                                                    cy="50"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-6xl font-black tracking-tighter text-white">{percentage}<span className="text-2xl text-blue-400">%</span></span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Final Score</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Stats Grid */}
                                    <div className="lg:col-span-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Accuracy</p>
                                                <p className="text-3xl font-black text-white">{correctCount} <span className="text-lg text-slate-600 font-bold ml-1">/ {questions.length}</span></p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Global Rank</p>
                                                {rank ? (
                                                    <p className="text-3xl font-black text-white">#{rank.position} <span className="text-lg text-slate-600 font-bold ml-1">/ {rank.total}</span></p>
                                                ) : (
                                                    <Loader2 className="animate-spin size-6 text-slate-600 mt-1" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Time Spent</p>
                                                <p className="text-3xl font-black text-white">{formatTime(result.time_taken || elapsedTime)} <span className="text-lg text-slate-600 font-bold ml-1">min</span></p>
                                            </div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Question Review Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h2 className="text-2xl font-black tracking-tight text-white">Question Review</h2>
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Correct</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-red-500"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500/80">Incorrect</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-8">
                                {questions.map((q, idx) => {
                                    const userAnswerId = answers[q.id];
                                    const isCorrect = userAnswerId === q.correct_answer;
                                    const isSkipped = !userAnswerId || userAnswerId === 'skipped';

                                    return (
                                        <div
                                            key={q.id}
                                            className={cn(
                                                "relative bg-[#111420] rounded-[24px] overflow-hidden border transition-all duration-300",
                                                isCorrect ? "border-emerald-500/10" : "border-red-500/10"
                                            )}
                                        >
                                            {/* Top Bar */}
                                            <div className="bg-black/20 px-8 py-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "size-10 rounded-xl flex items-center justify-center font-black text-sm",
                                                        isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                                    )}>
                                                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-200">{q.question_text}</h3>
                                                </div>
                                                <Badge variant="outline" className="bg-slate-900/50 border-slate-700 text-slate-400 font-black text-[10px] px-3 py-1">
                                                    {isCorrect ? q.marks : 0}.0 POINTS
                                                </Badge>
                                            </div>

                                            {/* Options */}
                                            <div className="p-8 space-y-3">
                                                {q.options.map((option: any) => {
                                                    const isSelected = userAnswerId === option.id;
                                                    const isTheCorrectAnswer = q.correct_answer === option.id;

                                                    return (
                                                        <div
                                                            key={option.id}
                                                            className={cn(
                                                                "group flex items-center gap-4 p-4 rounded-xl border transition-all",
                                                                isTheCorrectAnswer
                                                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                                                    : isSelected
                                                                        ? "bg-red-500/5 border-red-500/20"
                                                                        : "bg-slate-900/30 border-white/5 opacity-60"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-10 rounded-full flex items-center justify-center transition-colors",
                                                                isTheCorrectAnswer
                                                                    ? "bg-emerald-500 text-white"
                                                                    : isSelected
                                                                        ? "bg-red-500 text-white"
                                                                        : "bg-slate-800 text-slate-500"
                                                            )}>
                                                                {isTheCorrectAnswer ? <CheckCircle className="size-5" /> : isSelected ? <XCircle className="size-5" /> : <div className="size-2 rounded-full bg-current" />}
                                                            </div>
                                                            <span className={cn(
                                                                "flex-1 font-bold text-sm",
                                                                isTheCorrectAnswer ? "text-emerald-400" : isSelected ? "text-red-400" : "text-slate-400"
                                                            )}>
                                                                {option.text}
                                                            </span>
                                                            {isTheCorrectAnswer && (
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Correct Answer</span>
                                                            )}
                                                            {isSelected && !isTheCorrectAnswer && (
                                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full">Your Choice</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Explanation Section */}
                                                {q.explanation && (
                                                    <div className="mt-8 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4 items-start">
                                                        <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                            <Target className="size-4 text-blue-400" />
                                                        </div>
                                                        <p className="text-xs text-slate-400 leading-relaxed italic">
                                                            <span className="text-blue-400 font-bold uppercase tracking-wider block mb-1">Explanation:</span>
                                                            {q.explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>



                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (questions.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <FileText className="size-16 text-muted-foreground" />
                    <h2 className="text-2xl font-bold">No Questions Available</h2>
                    <Button onClick={() => navigate('/student/quizzes')}>Back to Quizzes</Button>
                </div>
            </DashboardLayout>
        );
    }

    const progress = (Object.keys(answers).length / questions.length) * 100;
    const currentQuestion = questions[safeCurrentIndex];

    if (!currentQuestion) {
        return null;
    }

    // ==================== QUIZ TAKING VIEW ====================
    return (
        <DashboardLayout fullHeight>
            <div
                ref={quizShellRef}
                className="h-full flex flex-col overflow-hidden bg-[#f8fafc] dark:bg-slate-950"
            >
                {/* Top Header Bar */}
                <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleBackNavigation}
                            className="size-9 rounded-xl text-slate-600 dark:text-slate-300"
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                        <h1 className="font-bold text-lg truncate">{quiz.title}</h1>
                    </div>

                    {/* Progress */}
                    <div className="hidden md:flex items-center gap-3 min-w-0">
                        <span className="text-sm text-muted-foreground font-medium">PROGRESS</span>
                        <div className="w-40 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isDesktopQuizMode && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={requestQuizFullscreen}
                                className="hidden lg:inline-flex border-slate-300 dark:border-slate-700"
                            >
                                <Maximize2 className="size-4 mr-2" />
                                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                            </Button>
                        )}

                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                            <Clock className="size-5 text-blue-500" />
                            <span className="font-mono font-bold text-lg tracking-wider">{formatTime(elapsedTime)}</span>
                        </div>
                    </div>
                </header>

                {isDesktopQuizMode && (
                    <div className="hidden lg:block shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="size-4 text-blue-500" />
                                <span>
                                    {isFullscreen
                                        ? 'Quiz is active in fullscreen mode.'
                                        : 'Fullscreen is required on desktop before you can continue this quiz.'}
                                </span>
                            </div>
                            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                {isFullscreen ? 'Fullscreen Active' : 'Waiting for Fullscreen'}
                            </Badge>
                        </div>
                    </div>
                )}

                <div
                    ref={quizContentRef}
                    className={cn(
                        "flex-1 flex overflow-hidden select-none [-webkit-touch-callout:none] [-webkit-user-select:none] [user-select:none]",
                        isQuizInteractionBlocked && "pointer-events-none blur-[2px] opacity-60"
                    )}
                    aria-hidden={isQuizInteractionBlocked}
                >
                    {/* Left Sidebar - Question Navigator */}
                    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Question Navigator</h3>

                        {/* Question Grid */}
                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {questions.map((q, i) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = i === currentIndex;

                                let className = "flex items-center justify-center size-10 rounded-lg font-bold text-sm transition-all cursor-pointer ";
                                if (isCurrent) {
                                    className += "bg-blue-500 text-white shadow-lg";
                                } else if (isAnswered) {
                                    className += "bg-emerald-500 text-white";
                                } else {
                                    className += "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700";
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIndex(i)}
                                        className={className}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1" />

                        {/* Legend */}
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legend</p>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="size-4 rounded bg-blue-500" />
                                <span>Current Question</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="size-4 rounded bg-emerald-500" />
                                <span>Answered</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="size-4 rounded bg-slate-200 dark:bg-slate-700" />
                                <span>Unanswered</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={handleAttemptSubmit}
                            disabled={submitting}
                            className="mt-6 w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <>Submit Exam <ChevronRight className="size-4 ml-1" /></>}
                        </Button>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-slate-950">
                        <div className="max-w-3xl mx-auto px-6 py-8">
                            {/* Question Header Row */}
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="text-3xl font-bold text-[#3b82f6]">Q{safeCurrentIndex + 1}</span>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Multiple Choice</span>
                                {questionDurations[currentQuestion.id] ? (
                                    <Badge variant="outline" className="border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                        {questionDurations[currentQuestion.id]}s on this question
                                    </Badge>
                                ) : null}
                            </div>

                            {/* Question Box */}
                            <div className="mb-8 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <p className="text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                                    {currentQuestion.question_text}
                                </p>
                            </div>

                            {/* Answer Options */}
                            <div className="space-y-3 mb-10">
                                {(currentQuestion.options || []).map((option: any, idx: number) => {
                                    const optionLetter = String.fromCharCode(65 + idx);
                                    const isSelected = answers[currentQuestion.id] === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleAnswerChange(currentQuestion.id, option.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${isSelected
                                                ? 'border-[#3b82f6] bg-blue-50/50 dark:bg-blue-500/10'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                                                }`}
                                        >
                                            {/* Letter Badge */}
                                            <span className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm shrink-0 ${isSelected
                                                ? 'bg-[#3b82f6] text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                {optionLetter}
                                            </span>
                                            {/* Option Text */}
                                            <span className={`flex-1 text-[15px] ${isSelected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {option.text}
                                            </span>
                                            {/* Checkmark */}
                                            {isSelected && (
                                                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#3b82f6]">
                                                    <CheckCircle className="size-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Bottom Navigation */}
                            <div className="space-y-3">
                                <div className="flex justify-end">
                                    <button
                                        onClick={clearAnswer}
                                        disabled={!answers[currentQuestion.id]}
                                        className="h-10 px-1 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40"
                                    >
                                        Clear Answer
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:flex md:items-center md:justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                        disabled={safeCurrentIndex === 0}
                                        className="h-11 w-full min-w-0 px-3 md:px-5 font-medium gap-2 border-slate-300 dark:border-slate-600"
                                    >
                                        <ChevronLeft className="size-4" /> Previous
                                    </Button>

                                    <Button
                                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        disabled={safeCurrentIndex === questions.length - 1}
                                        className="h-11 w-full min-w-0 px-3 md:px-6 font-medium gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white"
                                    >
                                        Next Question <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <div className="lg:hidden shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            onClick={handleAttemptSubmit}
                            disabled={submitting}
                            className="w-full h-12 bg-blue-500"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : 'Submit'}
                        </Button>
                    </div>
                </div>
            </div>
            <IntegrityPopup 
                open={isQuizInteractionBlocked}
                reason={fullscreenPromptReason}
                onAction={requestQuizFullscreen}
                isFullscreen={isFullscreen}
            />
            <DeleteConfirmDialog
                open={isConfirmSubmitOpen}
                onOpenChange={setIsConfirmSubmitOpen}
                onConfirm={handleSubmit}
                title="Submit Quiz?"
                description={`You have ${questions.length - Object.keys(answers).length} unanswered questions. Are you sure you want to submit your quiz now?`}
            />
        </DashboardLayout>
    );
}
