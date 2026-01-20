import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachment_name: string | null;
    attachment_url: string | null;
    attachment_type: string | null;
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
    type?: string;
}

export function useMessages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const fetchConversations = useCallback(async () => {
        if (!user) return;

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
    }, [user]);

    // Fetch conversations
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

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
    }, [user, fetchConversations]);

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
                    setMessages((data || []) as Message[]);
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
                setMessages([]);
            }
        };

        fetchMessages();

        fetchMessages();

        // Real-time subscription for messages and typing indicators
        const channel = supabase.channel(`messages_${selectedConversationId}`, {
            config: {
                broadcast: { self: false } // We don't want to receive our own typing events
            }
        });

        channel
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
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => {
                    const typerId = payload.payload.userId;
                    if (typerId !== user.id) {
                        setTypingUsers(prev => {
                            const newSet = new Set(prev);
                            newSet.add(typerId);
                            return newSet;
                        });

                        // Clear typing status after 3 seconds
                        setTimeout(() => {
                            setTypingUsers(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(typerId);
                                return newSet;
                            });
                        }, 3000);
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [selectedConversationId, user]);

    const sendTyping = async () => {
        if (!channelRef.current || !user) return;
        await channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id }
        });
    };

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
                    .maybeSingle();

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
                        .maybeSingle();

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
                    attachment_name: attachment?.name || null,
                    attachment_url: attachment?.url || null,
                    attachment_type: attachment?.type || null,
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

    // Start new conversation
    const startConversation = async (otherUserId: string) => {
        if (!user) return null;

        try {
            // Check if conversation exists
            const { data: existingConv } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
                .maybeSingle();

            if (existingConv) {
                setSelectedConversationId(existingConv.id);
                return existingConv.id;
            }

            // Create new conversation
            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({
                    participant_1: user.id,
                    participant_2: otherUserId,
                })
                .select()
                .single();

            if (error) throw error;

            await fetchConversations();
            setSelectedConversationId(newConv.id);
            return newConv.id;
        } catch (err) {
            console.error('Error starting conversation:', err);
            return null;
        }
    };

    // Delete message
    const deleteMessage = async (messageId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId)
                .eq('sender_id', user.id);

            if (error) throw error;

            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (err) {
            console.error('Error deleting message:', err);
            throw err;
        }
    };

    // Mark messages as read
    const markMessagesAsRead = async (conversationId: string) => {
        if (!user) return;

        try {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .eq('receiver_id', user.id)
                .eq('is_read', false);
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    return {
        conversations,
        messages,
        selectedConversationId,
        setSelectedConversationId,
        sendMessage,
        startConversation,
        deleteMessage,
        markMessagesAsRead,
        loading,
        error,
        refreshConversations: fetchConversations,
        typingUsers,
        sendTyping
    };
}
