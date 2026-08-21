import React, { useState } from "react";
import { useConversations, useConversationMessages } from "@/hooks/useMessages";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { UserAvatar } from "@/components/users/UserAvatar";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, Clock, Paperclip, RefreshCw, ChevronRight } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { ConversationItem } from "@/types";

export const MessagesModeration: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);

  const {
    data: convData,
    isLoading: loadingConvs,
    isError,
    refetch,
  } = useConversations({
    search,
    page,
    pageSize: 10,
  });

  const {
    data: messages,
    isLoading: loadingMessages,
  } = useConversationMessages(selectedConversation?.id || null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Messages feed refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh messages feed.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const conversations = convData?.data || [];
  const total = convData?.total || 0;
  const totalPages = convData?.totalPages || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Message Moderation</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Full Governance Access
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit and moderate conversations to ensure safe, compliant academic communications.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-9 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent min-w-[95px] self-start sm:self-auto"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left Column: Conversations List */}
        <Card className="lg:col-span-5 flex flex-col h-full overflow-hidden border-border bg-card">
          <div className="p-3.5 border-b border-border">
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search conversations by participant name or email..."
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {loadingConvs ? (
              <LoadingState count={5} />
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No conversations found"
                description="No active communication threads match your search."
              />
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const p1 = conv.participant_1_profile?.full_name || "User 1";
                const p2 = conv.participant_2_profile?.full_name || "User 2";

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`group p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      isSelected ? "bg-primary/10 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <UserAvatar name={p1} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {p1} <span className="text-muted-foreground font-normal">↔</span> {p2}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {conv.last_message || "No message content"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(conv.last_message_at)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-3 border-t border-border">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalRecords={total}
                pageSize={10}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </Card>

        {/* Right Column: Message Viewer */}
        <Card className="lg:col-span-7 flex flex-col h-full overflow-hidden border-border bg-card">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedConversation.participant_1_profile?.full_name || "User 1"} &{" "}
                    {selectedConversation.participant_2_profile?.full_name || "User 2"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Thread ID: {selectedConversation.id}
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                  {selectedConversation.is_class_conversation ? "Class Thread" : "Direct Message"}
                </span>
              </div>

              {/* Messages Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {loadingMessages ? (
                  <LoadingState count={4} />
                ) : !messages || messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-10">
                    No messages recorded in this conversation yet.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserAvatar
                            name={msg.sender_profile?.full_name || "Sender"}
                            size="sm"
                          />
                          <span className="text-xs font-bold text-foreground">
                            {msg.sender_profile?.full_name || "Participant"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({msg.sender_profile?.email || "email"})
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(msg.created_at, "MMM d, h:mm a")}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/90 pl-8 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      {msg.attachment_url && (
                        <div className="pl-8 pt-1">
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline bg-primary/5 px-2 py-1 rounded"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {msg.attachment_name || "View Attachment"}
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">Select a conversation</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Choose any thread from the list on the left to inspect its messages and moderation logs.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
