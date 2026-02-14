import { supabase } from "@/integrations/supabase/client";

export const knowledgeService = {
    async extractKeywords(text: string): Promise<string[]> {
        try {
            // Use the existing ai-chat function to extract keywords
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return [];

            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'Extract 3-5 key academic topics or keywords from the provided text. Return ONLY a JSON array of strings.'
                        },
                        {
                            role: 'user',
                            content: text.slice(0, 1000) // Limit to first 1000 chars for extraction
                        }
                    ],
                    stream: false
                }),
            });

            if (!response.ok) throw new Error('AI extraction failed');

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Attempt to parse JSON array
            const match = content.match(/\[.*\]/s);
            if (match) {
                return JSON.parse(match[0]);
            }

            return content.split(',').map((s: string) => s.trim().replace(/"/g, ''));
        } catch (error) {
            console.error('Keyword extraction error:', error);
            return [];
        }
    },

    async upsertKnowledgeNode(params: {
        type: 'chat' | 'note' | 'quiz' | 'assignment';
        sourceId: string;
        label: string;
        text: string;
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Check if node exists
        const { data: existing } = await supabase
            .from('knowledge_nodes')
            .select('id, keywords')
            .eq('user_id', user.id)
            .eq('source_id', params.sourceId)
            .single();

        // 2. Only extract if doesn't exist or we want to update (logic here: always update for now)
        const keywords = await this.extractKeywords(params.text);

        const { error } = await supabase
            .from('knowledge_nodes')
            .upsert({
                id: existing?.id,
                user_id: user.id,
                entity_type: params.type,
                source_id: params.sourceId,
                label: params.label,
                keywords: keywords,
                updated_at: new Date().toISOString()
            });

        if (error) console.error('Error upserting knowledge node:', error);
    },

    async deleteKnowledgeNode(sourceId: string) {
        const { error } = await supabase
            .from('knowledge_nodes')
            .delete()
            .eq('source_id', sourceId);

        if (error) console.error('Error deleting knowledge node:', error);
    }
};
