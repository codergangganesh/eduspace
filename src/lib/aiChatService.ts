import { supabase } from "@/integrations/supabase/client";

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageContent {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;
    };
}

export interface AIChatMessage {
    id: string;
    conversation_id: string;
    role: MessageRole;
    content: string | MessageContent[];
    created_at: string;
}

export interface AIConversation {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    is_pinned?: boolean;
    share_token?: string;
}

export const aiChatService = {
    async getConversations() {
        const { data, error } = await supabase
            .from('ai_conversations')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data as AIConversation[];
    },

    async getMessages(conversationId: string) {
        const { data, error } = await supabase
            .from('ai_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as AIChatMessage[];
    },

    async createConversation(title: string = 'New Chat') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('ai_conversations')
            .insert({
                user_id: user.id,
                title,
            })
            .select()
            .single();

        if (error) throw error;
        return data as AIConversation;
    },

    async deleteConversation(id: string) {
        const { error } = await supabase
            .from('ai_conversations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async saveMessage(conversationId: string, role: MessageRole, content: string | MessageContent[]) {
        const { data, error } = await supabase
            .from('ai_messages')
            .insert({
                conversation_id: conversationId,
                role,
                content,
            })
            .select()
            .single();

        if (error) throw error;

        // Also update the conversation's updated_at
        await supabase
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        return data as AIChatMessage;
    },

    async updateConversationTitle(id: string, title: string) {
        const { error } = await supabase
            .from('ai_conversations')
            .update({ title })
            .eq('id', id);

        if (error) throw error;
    },

    async togglePin(id: string) {
        const { data, error } = await supabase
            .rpc('toggle_ai_conversation_pin', { conv_id: id });

        if (error) throw error;
        return data as boolean;
    },

    async toggleShare(id: string) {
        const { data, error } = await supabase
            .rpc('toggle_ai_conversation_share', { conv_id: id });

        if (error) throw error;
        return data as string | null;
    },

    async getSharedConversation(shareToken: string) {
        // 1. Get the conversation
        const { data: conv, error: convError } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('share_token', shareToken)
            .single();

        if (convError) throw convError;

        // 2. Get the owner's profile separately to avoid relationship errors
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', conv.user_id)
            .single();

        // 3. Get the messages
        const { data: messages, error: msgError } = await supabase
            .from('ai_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        return {
            conversation: { ...conv, profiles: profile } as (AIConversation & { profiles: { full_name: string, avatar_url: string } }),
            messages: messages as AIChatMessage[]
        };
    },

    async updateMessage(id: string, content: string) {
        const { error } = await supabase
            .from('ai_messages')
            .update({ content })
            .eq('id', id);

        if (error) throw error;
    },

    async transcribeAudio(audioBlob: Blob) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');

        const { data, error } = await supabase.functions.invoke('ai-transcribe', {
            body: formData,
        });

        if (error) {
            console.error('Transcription function error:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }

        return data.text as string;
    },

    async streamChat(messages: { role: string; content: string | MessageContent[] }[], onToken: (token: string) => void) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Authentication required for AI chat.');

            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ messages, stream: true }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText };
                }
                console.error('AI Chat Error Details:', errorData);
                throw new Error(errorData.details || errorData.error || 'AI Service Error');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Response body is null');

            const decoder = new TextDecoder();
            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(dataStr);
                            const token = parsed.choices?.[0]?.delta?.content || "";
                            if (token) {
                                fullContent += token;
                                onToken(token);
                            }
                        } catch (e) {
                            // Partial chunk
                        }
                    }
                }
            }

            return fullContent;

        } catch (error: any) {
            console.error('Chat error:', error);
            throw error;
        }
    },
};
