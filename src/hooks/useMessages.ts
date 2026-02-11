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
    attachment_size: string | null;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
    sender_name?: string;
    is_edited?: boolean;
    edit_count?: number;
    last_edited_at?: string;
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
    cleared_at?: Record<string, string> | null;
    visible_to?: string[] | null;
    auto_delete_settings?: Record<string, boolean>;
}

interface Attachment {
    name?: string;
    url?: string;
    type?: string;
    size?: string;
}

export function useMessages() {
    const { user, profile } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    // Pagination state
    const [hasMore, setHasMore] = useState(false);
    const PAGE_SIZE = 20;
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
                // Filter conversations where user is in visible_to
                const visibleConversations = (data || []).filter(conv =>
                    !conv.visible_to || conv.visible_to.includes(user.id)
                );

                // Fetch other user details
                const conversationsWithUsers = await Promise.all(
                    visibleConversations.map(async (conv) => {
                        const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url')
                            .eq('user_id', otherUserId)
                            .maybeSingle();

                        // If no profile data, try class_students table (for imported students who haven't registered)
                        let otherUserName = profileData?.full_name;
                        let otherUserAvatar = profileData?.avatar_url;

                        if (!otherUserName) {
                            const { data: classStudentData } = await supabase
                                .from('class_students')
                                .select('student_name, student_image_url')
                                .eq('student_id', otherUserId)
                                .limit(1)
                                .maybeSingle();

                            if (classStudentData) {
                                otherUserName = classStudentData.student_name;
                                otherUserAvatar = classStudentData.student_image_url || otherUserAvatar;
                            }
                        }

                        const { data: roleData } = await supabase
                            .from('user_roles')
                            .select('role')
                            .eq('user_id', otherUserId)
                            .maybeSingle();

                        return {
                            ...conv,
                            other_user_name: otherUserName || 'Unknown User',
                            other_user_avatar: otherUserAvatar,
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
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch conversations effect
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        fetchConversations();

        const subscription = supabase
            .channel('conversations_global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => fetchConversations()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user, fetchConversations]);

    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!user) return;
        try {
            await supabase
                .from('messages')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .eq('receiver_id', user.id)
                .is('read_at', null); // Only update if not already read
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    }, [user]);

    // Fetch messages effect
    useEffect(() => {
        if (!selectedConversationId || !user) return;

        const fetchMessages = async (isLoadMore = false) => {
            try {
                const currentLength = isLoadMore ? messages.length : 0;
                const from = currentLength;
                const to = from + PAGE_SIZE - 1;

                const { data, error: fetchError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', selectedConversationId)
                    .order('created_at', { ascending: false })
                    .range(from, to);

                if (fetchError) throw fetchError;

                let filteredData = data || [];
                const currentConv = conversations.find(c => c.id === selectedConversationId);

                if (currentConv?.cleared_at && currentConv.cleared_at[user.id]) {
                    const clearedTime = new Date(currentConv.cleared_at[user.id]).getTime();
                    filteredData = filteredData.filter(msg => new Date(msg.created_at).getTime() > clearedTime);
                }

                // Apply individual auto-delete filter (15 days rolling window)
                if (currentConv?.auto_delete_settings?.[user.id]) {
                    const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);
                    filteredData = filteredData.filter(msg => new Date(msg.created_at).getTime() > fifteenDaysAgo);
                }

                const newMessages = [...filteredData].reverse();
                if (isLoadMore) {
                    setMessages(prev => [...newMessages, ...prev]);
                } else {
                    setMessages(newMessages);
                }
                setHasMore(filteredData.length === PAGE_SIZE);
            } catch (err) {
                console.error('Error in fetchMessages:', err);
            }
        };

        fetchMessages();

        const channel = supabase.channel(`messages_${selectedConversationId}`, {
            config: { broadcast: { self: false } }
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
                (payload) => {
                    const newMessage = payload.new as Message;
                    const currentConv = conversations.find(c => c.id === selectedConversationId);

                    setMessages((prev) => {
                        // Filter real-time messages too
                        if (currentConv?.auto_delete_settings?.[user.id]) {
                            const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);
                            if (new Date(newMessage.created_at).getTime() <= fifteenDaysAgo) return prev;
                        }

                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                    if (newMessage.sender_id !== user.id) {
                        markMessagesAsRead(selectedConversationId);
                    }
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
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversationId}`,
                },
                (payload) => {
                    const updatedMessage = payload.new as Message;
                    setMessages((prev) =>
                        prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
                    );
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [selectedConversationId, user, conversations, markMessagesAsRead]);

    const sendTyping = async () => {
        if (!channelRef.current || !user) return;
        await channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id }
        });
    };

    const sendMessage = async (receiverId: string, content: string, attachment?: Attachment) => {
        if (!user || (!content.trim() && !attachment)) return;

        const finalContent = content.trim() || (attachment ? 'Sent an attachment' : '');
        const optimisticId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        try {
            let conversationId: string | null = null;
            if (selectedConversationId) {
                const currentConv = conversations.find(c => c.id === selectedConversationId);
                if (currentConv && (currentConv.participant_1 === receiverId || currentConv.participant_2 === receiverId)) {
                    conversationId = selectedConversationId;
                }
            }

            const optimisticMessage: Message = {
                id: optimisticId,
                conversation_id: conversationId || 'temp-id',
                sender_id: user.id,
                receiver_id: receiverId,
                content: finalContent,
                attachment_name: attachment?.name || null,
                attachment_url: attachment?.url || null,
                attachment_type: attachment?.type || null,
                attachment_size: attachment?.size || null,
                is_read: false,
                created_at: timestamp,
                sender_name: 'You'
            };

            if (conversationId) {
                setMessages(prev => [...prev, optimisticMessage]);
            }

            if (!conversationId) {
                const { data: existingConv } = await supabase
                    .from('conversations')
                    .select('*')
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
                            last_message_at: timestamp,
                            visible_to: [user.id, receiverId] // Critical: set visibility on creation
                        })
                        .select()
                        .single();

                    if (convError) throw convError;
                    conversationId = newConv.id;
                    optimisticMessage.conversation_id = conversationId;
                    setSelectedConversationId(conversationId);
                    setMessages(prev => [...prev, optimisticMessage]);
                }
            } else {
                optimisticMessage.conversation_id = conversationId;
            }

            // Insert real message
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    id: optimisticId,
                    conversation_id: conversationId,
                    sender_id: user.id,
                    receiver_id: receiverId,
                    content: finalContent,
                    attachment_name: attachment?.name || null,
                    attachment_url: attachment?.url || null,
                    attachment_type: attachment?.type || null,
                    attachment_size: attachment?.size || null,
                });

            if (messageError) {
                // Retry without attachment_size if error
                const { error: retryError } = await supabase
                    .from('messages')
                    .insert({
                        id: optimisticId,
                        conversation_id: conversationId,
                        sender_id: user.id,
                        receiver_id: receiverId,
                        content: finalContent,
                        attachment_name: attachment?.name || null,
                        attachment_url: attachment?.url || null,
                        attachment_type: attachment?.type || null,
                    });
                if (retryError) {
                    setMessages(prev => prev.filter(m => m.id !== optimisticId));
                    throw retryError;
                }
            }

            // Update conversation and ENSURE VISIBILITY (Resurrection)
            // This is critical for messages "reaching" the other person if they hidden it
            await supabase
                .from('conversations')
                .update({
                    last_message: finalContent,
                    last_message_at: timestamp,
                    visible_to: [user.id, receiverId] // Always reset visibility for both
                })
                .eq('id', conversationId);

            // Trigger Notification (Push + In-App if enabled)
            if (user && profile && conversationId) {
                // Import dynamically to avoid circular dependencies if any
                import('@/lib/notificationService').then(({ notifyNewMessage }) => {
                    notifyNewMessage(
                        receiverId,
                        profile.full_name || 'New Message',
                        finalContent,
                        conversationId!,
                        user.id,
                        profile.avatar_url || undefined
                    ).catch(err => console.error("Failed to notify message:", err));
                });
            }

            // Manual notification fallback if needed (Optional, but DB trigger is better)
            // We'll skip manual here to avoid double-notification if DB trigger works.

        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            throw err;
        }
    };

    const startConversation = async (otherUserId: string) => {
        if (!user) return null;
        try {
            const { data: existingConv } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
                .maybeSingle();

            if (existingConv) {
                setSelectedConversationId(existingConv.id);
                return existingConv.id;
            }

            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({
                    participant_1: user.id,
                    participant_2: otherUserId,
                    visible_to: [user.id, otherUserId]
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

    const clearChat = async (conversationId: string) => {
        if (!user) return;
        try {
            const conversation = conversations.find(c => c.id === conversationId);
            const updatedClearedAt = {
                ...(conversation?.cleared_at || {}),
                [user.id]: new Date().toISOString()
            };
            const { error } = await supabase
                .from('conversations')
                .update({ cleared_at: updatedClearedAt })
                .eq('id', conversationId);
            if (error) throw error;
            setMessages([]);
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, cleared_at: updatedClearedAt } : c
            ));
        } catch (err) {
            console.error('Error clearing chat:', err);
            throw err;
        }
    };

    const hideChat = async (conversationId: string) => {
        if (!user) return;
        try {
            const conversation = conversations.find(c => c.id === conversationId);
            if (!conversation) return;
            const updatedVisibleTo = (conversation.visible_to || [conversation.participant_1, conversation.participant_2])
                .filter(id => id !== user.id);
            const { error } = await supabase
                .from('conversations')
                .update({ visible_to: updatedVisibleTo })
                .eq('id', conversationId);
            if (error) throw error;
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (selectedConversationId === conversationId) setSelectedConversationId(null);
        } catch (err) {
            console.error('Error hiding chat:', err);
            throw err;
        }
    };

    const unhideChat = async (conversationId: string) => {
        if (!user) return;
        try {
            const { data: conversation } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .maybeSingle();

            if (!conversation) return;
            const currentVisible = conversation.visible_to || [conversation.participant_1, conversation.participant_2];
            if (!currentVisible.includes(user.id)) {
                await supabase
                    .from('conversations')
                    .update({ visible_to: [...currentVisible, user.id] })
                    .eq('id', conversationId);
            }
            await fetchConversations();
        } catch (err) {
            console.error('Error unhiding chat:', err);
        }
    };

    const editMessage = async (messageId: string, newContent: string) => {
        if (!user) return;
        try {
            const timestamp = new Date().toISOString();
            // Optimistic
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, content: newContent, is_edited: true, last_edited_at: timestamp } : m
            ));
            const { error } = await supabase.rpc('edit_message', {
                message_id: messageId,
                new_content: newContent,
                editing_user_id: user.id
            });
            if (error) throw error;
        } catch (err) {
            console.error('Error editing message:', err);
            // Revert
            const { data: original } = await supabase.from('messages').select('*').eq('id', messageId).single();
            if (original) setMessages(prev => prev.map(m => m.id === messageId ? (original as Message) : m));
        }
    };

    const loadMoreMessages = async () => {
        if (!selectedConversationId || !hasMore) return;
        const from = messages.length;
        const to = from + PAGE_SIZE - 1;
        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', selectedConversationId)
                .order('created_at', { ascending: false })
                .range(from, to);
            if (fetchError) throw fetchError;
            const newMessages = [...(data || [])].reverse();
            setMessages(prev => [...newMessages, ...prev]);
            setHasMore(data?.length === PAGE_SIZE);
        } catch (err) {
            console.error("Error in loadMoreMessages:", err);
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
        sendTyping,
        clearChat,
        toggleAutoDelete: async (conversationId: string, enabled: boolean) => {
            if (!user) return;
            try {
                const conversation = conversations.find(c => c.id === conversationId);
                const updatedSettings = {
                    ...(conversation?.auto_delete_settings || {}),
                    [user.id]: enabled
                };

                const { error } = await supabase
                    .from('conversations')
                    .update({ auto_delete_settings: updatedSettings })
                    .eq('id', conversationId);

                if (error) throw error;

                // Update local state
                setConversations(prev => prev.map(c =>
                    c.id === conversationId ? { ...c, auto_delete_settings: updatedSettings } : c
                ));
            } catch (err) {
                console.error('Error toggling auto-delete:', err);
                throw err;
            }
        },
        deleteChat: hideChat, // Soft delete compatibility
        hideChat,
        unhideChat,
        finalizeDeleteChat: clearChat,
        editMessage,
        hasMore,
        loadMoreMessages
    };
}
