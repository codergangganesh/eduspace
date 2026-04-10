import { supabase } from "@/integrations/supabase/client";

export type MessageRole = 'user' | 'assistant' | 'system';
export type PracticeMode = 'interview' | 'language' | 'presentation' | 'sales' | 'academic' | 'confidence';

export interface VoiceMessage {
    id: string;
    session_id: string;
    role: MessageRole;
    content: string;
    created_at: string;
}

export interface VoiceSession {
    id: string;
    user_id: string;
    title: string;
    practice_mode?: PracticeMode | null;
    focus_area?: string | null;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
    target_duration_minutes?: number | null;
    summary?: string | null;
    rubric_score?: number | null;
    recommendations?: string[] | null;
    session_metrics?: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

export interface CreateVoiceSessionInput {
    title?: string;
    practice_mode?: PracticeMode;
    focus_area?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    target_duration_minutes?: number;
}

export const voiceService = {
    async getSessions() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await (supabase as any)
            .from('voice_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data as VoiceSession[];
    },

    async getMessages(sessionId: string) {
        const { data, error } = await (supabase as any)
            .from('voice_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as VoiceMessage[];
    },

    async createSession(input: string | CreateVoiceSessionInput = 'New Practice') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const payload = typeof input === 'string'
            ? { title: input }
            : input;

        const richPayload = {
            user_id: user.id,
            title: payload.title ?? 'New Practice',
            practice_mode: payload.practice_mode ?? null,
            focus_area: payload.focus_area ?? null,
            difficulty: payload.difficulty ?? null,
            target_duration_minutes: payload.target_duration_minutes ?? null,
        };

        const fallbackPayload = {
            user_id: user.id,
            title: payload.title ?? 'New Practice',
        };

        let result = await (supabase as any)
            .from('voice_sessions')
            .insert(richPayload)
            .select()
            .single();

        if (result.error && (result.error.code === 'PGRST204' || String(result.error.message || '').includes('Could not find'))) {
            result = await (supabase as any)
                .from('voice_sessions')
                .insert(fallbackPayload)
                .select()
                .single();
        }

        const { data, error } = result;

        if (error) throw error;
        return data as VoiceSession;
    },

    async deleteSession(id: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await (supabase as any)
            .from('voice_sessions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    async saveMessage(sessionId: string, role: MessageRole, content: string) {
        const { data, error } = await (supabase as any)
            .from('voice_messages')
            .insert({
                session_id: sessionId,
                role,
                content,
            })
            .select()
            .single();

        if (error) throw error;

        // Update the session's updated_at
        await (supabase as any)
            .from('voice_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);

        return data as VoiceMessage;
    },

    async updateSessionTitle(id: string, title: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await (supabase as any)
            .from('voice_sessions')
            .update({ title })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    async updateSessionMeta(
        id: string,
        updates: Partial<Pick<VoiceSession, 'practice_mode' | 'focus_area' | 'difficulty' | 'target_duration_minutes' | 'summary' | 'rubric_score' | 'recommendations' | 'session_metrics'>>
    ) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await (supabase as any)
            .from('voice_sessions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error && (error.code === 'PGRST204' || String(error.message || '').includes('Could not find'))) {
            return;
        }

        if (error) throw error;
    }
};
