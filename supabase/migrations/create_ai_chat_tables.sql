-- Create AI Chat Conversations table
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create AI Chat Messages table
CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversations
CREATE POLICY "Users can view their own AI conversations"
    ON public.ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI conversations"
    ON public.ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI conversations"
    ON public.ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI conversations"
    ON public.ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for ai_messages
CREATE POLICY "Users can view messages in their own AI conversations"
    ON public.ai_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.ai_conversations
        WHERE id = ai_messages.conversation_id
        AND user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages into their own AI conversations"
    ON public.ai_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.ai_conversations
        WHERE id = ai_messages.conversation_id
        AND user_id = auth.uid()
    ));

-- Trigger for updated_at on ai_conversations
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
