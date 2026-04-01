import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AgentConversation {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export interface AgentHistoryItem {
  id: string;
  sender: "user" | "agent";
  content: string;
  created_at: string;
  type: string;
}

export const useAgentHistory = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [history, setHistory] = useState<AgentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("agent_conversations" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations((data as any) || []);
    } catch (error) {
      console.error("Error fetching agent conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("agent_history" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const mapped = (data || []).map((m: any) => ({
        id: m.id,
        sender: m.role as "user" | "agent",
        content: m.content,
        created_at: m.created_at,
        type: m.type
      }));

      setHistory(mapped);
    } catch (error) {
      console.error("Error fetching agent history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("agent_conversations" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting agent conversation:", error);
    }
  }, [user]);

  return { 
    conversations, 
    history, 
    isLoading, 
    fetchConversations, 
    fetchHistory, 
    deleteConversation 
  };
};
