import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachment_name?: string;
    attachment_url?: string;
    attachment_size?: string;
    attachment_type?: string;
    is_read: boolean;
    created_at: string;
    sender_name?: string;
}

interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message: string | null;
    last_message_at: string | null;
    other_user_name?: string;
    other_user_avatar?: string;
    other_user_role?: string;
    online?: boolean;
}

interface Attachment {
    name?: string;
    url?: string;
    size?: string;
    type?: string;
}

export function useMessages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch conversations
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchConversations = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('conversations')
                    .select('*')
                    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
                    .order('last_message_at', { ascending: false });

                if (fetchError) {
                    console.warn('Error fetching conversations:', fetchError);
                    setConversations([]);
                } else {
                    // Fetch other user details for each conversation
                    const conversationsWithUsers = await Promise.all(
                        (data || []).map(async (conv) => {
                            const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('full_name, avatar_url')
                                .eq('user_id', otherUserId)
                                .single();

                            const { data: roleData } = await supabase
                                .from('user_roles')
                                .select('role')
                                .eq('user_id', otherUserId)
                                .single();

                            return {
                                ...conv,
                                other_user_name: profileData?.full_name || 'Unknown User',
                                other_user_avatar: profileData?.avatar_url,
                                other_user_role: roleData?.role,
                            };
                        })
                    );

                    setConversations(conversationsWithUsers);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching conversations:', err);
                setConversations([]);
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();

        // Real-time subscription for conversations
        const subscription = supabase
            .channel('conversations_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                },
                () => {
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    // Fetch messages for selected conversation
    useEffect(() => {
        if (!selectedConversationId || !user) return;

        const fetchMessages = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', selectedConversationId)
                    .order('created_at', { ascending: true });

                if (fetchError) {
                    console.warn('Error fetching messages:', fetchError);
                    setMessages([]);
                } else {
                    setMessages(data || []);
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
                setMessages([]);
            }
        };

        fetchMessages();

        // Real-time subscription for messages
        const subscription = supabase
            .channel(`messages_${selectedConversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversationId}`,
                },
                () => {
                    fetchMessages();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [selectedConversationId, user]);

    // Send message
    const sendMessage = async (receiverId: string, content: string, attachment?: Attachment) => {
        if (!user || !content.trim()) return;

        try {
            // Find or create conversation
            let conversationId = selectedConversationId;

            if (!conversationId) {
                const { data: existingConv } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`and(participant_1.eq.${user.id},participant_2.eq.${receiverId}),and(participant_1.eq.${receiverId},participant_2.eq.${user.id})`)
                    .single();

                if (existingConv) {
                    conversationId = existingConv.id;
                } else {
                    const { data: newConv, error: convError } = await supabase
                        .from('conversations')
                        .insert({
                            participant_1: user.id,
                            participant_2: receiverId,
                            last_message: content,
                            last_message_at: new Date().toISOString(),
                        })
                        .select()
                        .single();

                    if (convError) throw convError;
                    conversationId = newConv.id;
                }
            }

            // Insert message
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    receiver_id: receiverId,
                    content,
                    attachment_name: attachment?.name,
                    attachment_url: attachment?.url,
                    attachment_size: attachment?.size,
                    attachment_type: attachment?.type,
                });

            if (messageError) throw messageError;

            // Update conversation last message
            await supabase
                .from('conversations')
                .update({
                    last_message: content,
                    last_message_at: new Date().toISOString(),
                })
                .eq('id', conversationId);

        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        }
    };

    return {
        conversations,
        messages,
        selectedConversationId,
        setSelectedConversationId,
        sendMessage,
        loading,
        error,
    };
}
