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
}

interface Attachment {
    name?: string;
    url?: string;
    type?: string;
    size?: string;
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
                // Filter conversations where user is in visible_to (handle null as visible to all for backward compatibility or migration)
                const visibleConversations = (data || []).filter(conv =>
                    !conv.visible_to || conv.visible_to.includes(user.id)
                );

                // Fetch other user details for each conversation
                const conversationsWithUsers = await Promise.all(
                    visibleConversations.map(async (conv) => {
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
                    const currentConv = conversations.find(c => c.id === selectedConversationId);
                    let filteredData = data || [];

                    // Filter messages based on cleared_at
                    if (currentConv?.cleared_at && currentConv.cleared_at[user.id]) {
                        const clearedTime = new Date(currentConv.cleared_at[user.id]).getTime();
                        filteredData = filteredData.filter(msg => new Date(msg.created_at).getTime() > clearedTime);
                    }

                    setMessages(filteredData as Message[]);
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
                (payload) => {
                    const newMessage = payload.new as Message;
                    // Deduplicate: Check if message already exists
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMessage.id)) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });
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
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // Listen for updates (edits)
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversationId}`,
                },
                (payload) => {
                    const updatedMessage = payload.new as Message;
                    if (updatedMessage && updatedMessage.conversation_id === selectedConversationId) {
                        setMessages((prev) =>
                            prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
                        );
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'new_message' },
                (payload) => {
                    const newMessage = payload.payload as Message;
                    // Only process if it belongs to current conversation (safety check)
                    if (newMessage && newMessage.conversation_id === selectedConversationId) {
                        setMessages((prev) => {
                            if (prev.some(m => m.id === newMessage.id)) {
                                return prev; // Avoid duplicates
                            }
                            return [...prev, newMessage];
                        });
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to messages channel:', selectedConversationId);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('There was an error subscribing to messages channel.');
                }
            });

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
        if (!user || (!content.trim() && !attachment)) return;

        // If content is empty but we have an attachment, use a placeholder
        const finalContent = content.trim() || (attachment ? 'Sent an attachment' : '');

        const optimisticId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        try {
            // Find or create conversation
            let conversationId: string | null = null;

            // Validate if selectedConversationId matches the intended receiver
            // This prevents messages from being sent to the wrong conversation if the selection logic is stale
            if (selectedConversationId) {
                const currentConv = conversations.find(c => c.id === selectedConversationId);
                if (currentConv && (currentConv.participant_1 === receiverId || currentConv.participant_2 === receiverId)) {
                    conversationId = selectedConversationId;
                }
            }

            // Optimistic update for UI
            const optimisticMessage: Message = {
                id: optimisticId,
                conversation_id: conversationId || 'temp-id', // Temporary ID if creating new
                sender_id: user.id,
                receiver_id: receiverId,
                content: finalContent,
                attachment_name: attachment?.name || null,
                attachment_url: attachment?.url || null,
                attachment_type: attachment?.type || null,
                attachment_size: attachment?.size || null,
                is_read: false,
                created_at: timestamp,
                sender_name: 'You' // Will be refreshed or handled by UI
            };

            // Assuming conversation exists for now in the optimistic update logic if we have ID
            if (conversationId) {
                setMessages(prev => [...prev, optimisticMessage]);
            }

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
                            last_message_at: timestamp,
                        })
                        .select()
                        .maybeSingle();

                    if (convError) throw convError;
                    conversationId = newConv.id;

                    // Update the optimistic message with the real conversation ID
                    optimisticMessage.conversation_id = conversationId;

                    // If we just created the conversation, set it as selected
                    setSelectedConversationId(conversationId);

                    // Add optimistic message now if needed
                    if (!selectedConversationId) {
                        setMessages(prev => [...prev, optimisticMessage]);
                    }
                }
            } else {
                // Ensure specific optimistic ID is used
                optimisticMessage.conversation_id = conversationId;
            }

            // BROADCAST MESSAGE IMMEDIATELY (Instant Delivery)
            if (channelRef.current && conversationId === selectedConversationId) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'new_message',
                    payload: optimisticMessage
                });
            }

            // Insert message
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    id: optimisticId, // Ensure we use the same ID
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
                console.warn("Initial message insert failed. Retrying without attachment_size (schema mismatch likely).", messageError);

                // Fallback: Retry without attachment_size
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
                        // omit attachment_size
                    });

                if (retryError) {
                    // Start Rollback
                    setMessages(prev => prev.filter(m => m.id !== optimisticId));
                    throw retryError;
                }
            }

            // Update conversation last message AND ensure visibility (Resurrection)
            const currentConv = conversations.find(c => c.id === conversationId);
            let updatePayload: any = {
                last_message: finalContent,
                last_message_at: timestamp,
            };

            // If we have conversation data, check if we need to update visible_to
            if (currentConv) {
                const participants = [currentConv.participant_1, currentConv.participant_2];
                const currentVisibleTo = currentConv.visible_to || participants;

                // If anyone is missing from visible_to, reset it to include everyone
                // This logic ensures that if the *other* person deleted the chat, it reappears for them.
                // And if *I* deleted it (but am now sending a message), it reappears for me (though I'm already in it conceptually if I'm sending).
                const isEveryoneVisible = participants.every(p => currentVisibleTo.includes(p));

                if (!isEveryoneVisible) {
                    updatePayload.visible_to = participants;
                }
            } else {
                // Should normally have currentConv by now, but just in case for new convs, default is null which migration sets to all.
                // If this is a brand new insert (handled in the 'else' block above), it defaults to null/all. 
                // This block is for UPDATING existing convs.
            }

            await supabase
                .from('conversations')
                .update(updatePayload)
                .eq('id', conversationId);

            // Send notification to receiver
            try {
                const { data: senderProfile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('user_id', user.id)
                    .single();

                // Import notification service dynamically to avoid circular dependencies
                const { notifyNewMessage } = await import('@/lib/notificationService');

                await notifyNewMessage(
                    receiverId,
                    senderProfile?.full_name || 'Someone',
                    finalContent.substring(0, 100),
                    conversationId,
                    user.id // sender_id
                );
            } catch (notifError) {
                // Don't fail the message send if notification fails
                console.warn('Failed to send message notification:', notifError);
            }

            if (messageError && !selectedConversationId && conversationId) {
                // If fallback insert was needed (logic inside messageError block), ensure we don't double count or handle it there
                // The fallback logic is inside the if(messageError) block below which isn't fully visible here but understood.
            }
        } catch (err) {
            console.error('Error sending message:', err);
            // Ensure rollback if not caught above
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
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

    // Clear chat (hide messages for current user)
    const clearChat = async (conversationId: string) => {
        if (!user) return;

        try {
            const conversation = conversations.find(c => c.id === conversationId);
            const currentClearedAt = conversation?.cleared_at || {};

            const updatedClearedAt = {
                ...currentClearedAt,
                [user.id]: new Date().toISOString()
            };

            const { error } = await supabase
                .from('conversations')
                .update({ cleared_at: updatedClearedAt })
                .eq('id', conversationId);

            if (error) throw error;

            // Optimistic update
            setMessages([]);
            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? { ...c, cleared_at: updatedClearedAt }
                    : c
            ));
        } catch (err) {
            console.error('Error clearing chat:', err);
            throw err;
        }
    };

    // Delete chat (hide conversation from list)
    const deleteChat = async (conversationId: string) => {
        if (!user) return;

        try {
            const conversation = conversations.find(c => c.id === conversationId);
            if (!conversation) return;

            const currentVisibleTo = conversation.visible_to || [conversation.participant_1, conversation.participant_2];
            const updatedVisibleTo = currentVisibleTo.filter(id => id !== user.id);

            // Also clear messages effectively by updating cleared_at if not already cleared?
            // User requested "Previous messages remain hidden for the deleting user" when resurfaces.
            // So we should basically do a "Clear Chat" AND "Hide Chat".

            const currentClearedAt = conversation.cleared_at || {};
            const updatedClearedAt = {
                ...currentClearedAt,
                [user.id]: new Date().toISOString()
            };

            const { error } = await supabase
                .from('conversations')
                .update({
                    visible_to: updatedVisibleTo,
                    cleared_at: updatedClearedAt
                })
                .eq('id', conversationId);

            if (error) throw error;

            // Optimistic update: Remove from list
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (selectedConversationId === conversationId) {
                setSelectedConversationId(null);
            }
        } catch (err) {
            console.error('Error deleting chat:', err);
            throw err;
        }
    };

    // Edit message
    const editMessage = async (messageId: string, newContent: string) => {
        if (!user) return;

        try {
            // Optimistic update
            const timestamp = new Date().toISOString();
            setMessages(prev => prev.map(m =>
                m.id === messageId
                    ? { ...m, content: newContent, is_edited: true, edit_count: (m.edit_count || 0) + 1, last_edited_at: timestamp }
                    : m
            ));

            const { data, error } = await supabase.rpc('edit_message', {
                message_id: messageId,
                new_content: newContent,
                editing_user_id: user.id
            });

            if (error) throw error;
            if (data && !data.success) {
                throw new Error(data.error || 'Failed to edit message');
            }
        } catch (err) {
            console.error('Error editing message:', err);
            // Revert optimistic update by fetching original
            const { data: original } = await supabase
                .from('messages')
                .select('*')
                .eq('id', messageId)
                .single();
            if (original) {
                setMessages(prev => prev.map(m => m.id === messageId ? (original as Message) : m));
            }
            throw err;
        }
    };

    // Hide chat (Soft delete for list - Undoable step 1)
    const hideChat = async (conversationId: string) => {
        if (!user) return;

        try {
            const conversation = conversations.find(c => c.id === conversationId);
            if (!conversation) return;

            const currentVisibleTo = conversation.visible_to || [conversation.participant_1, conversation.participant_2];
            // Remove user from visible_to
            const updatedVisibleTo = currentVisibleTo.filter(id => id !== user.id);

            const { error } = await supabase
                .from('conversations')
                .update({ visible_to: updatedVisibleTo })
                .eq('id', conversationId);

            if (error) throw error;

            // Optimistic update: Remove from list
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (selectedConversationId === conversationId) {
                setSelectedConversationId(null);
            }
        } catch (err) {
            console.error('Error hiding chat:', err);
            throw err;
        }
    };

    // Unhide chat (Restore from list - Undo step)
    const unhideChat = async (conversationId: string) => {
        if (!user) return;

        try {
            // Fetch conversation data
            const { data: conversation, error: fetchError } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .maybeSingle();

            if (fetchError || !conversation) throw fetchError || new Error("Chat not found");

            const currentVisibleTo = conversation.visible_to || [conversation.participant_1, conversation.participant_2];
            // Add user back if not present
            if (!currentVisibleTo.includes(user.id)) {
                const updatedVisibleTo = [...currentVisibleTo, user.id];

                const { error } = await supabase
                    .from('conversations')
                    .update({ visible_to: updatedVisibleTo })
                    .eq('id', conversationId);

                if (error) throw error;
            }

            // Trigger a refetch
            await fetchConversations();
        } catch (err) {
            console.error('Error unhiding chat:', err);
            throw err;
        }
    };

    // Finalize Delete (Clear history - Step 2)
    const finalizeDeleteChat = async (conversationId: string) => {
        await clearChat(conversationId);
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
        sendTyping,
        clearChat,
        deleteChat: finalizeDeleteChat, // Keep compatibility if needed, but UI uses hide first
        hideChat,
        unhideChat,
        finalizeDeleteChat,
        editMessage
    };
}
