import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, LifeBuoy, MessageSquareMore, Send, Sparkles, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAssignmentHelpRequests } from "@/hooks/useAssignmentHelpRequests";

interface AssignmentHelpPanelProps {
  assignmentId?: string | null;
  classId?: string | null;
  lecturerId?: string | null;
  assignmentTitle?: string | null;
  anchorId?: string;
  useContainerHeight?: boolean;
  canCreateRequest?: boolean;
  className?: string;
}

function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "ES"
  );
}

export function AssignmentHelpPanel({
  assignmentId,
  classId,
  lecturerId,
  assignmentTitle,
  anchorId = "quick-help",
  useContainerHeight = false,
  canCreateRequest = false,
  className,
}: AssignmentHelpPanelProps) {
  const [requestDraft, setRequestDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const {
    requests,
    loading,
    submitting,
    replyingToId,
    resolvingId,
    createRequest,
    addReply,
    resolveRequest,
  } = useAssignmentHelpRequests({
    assignmentId,
    classId,
    lecturerId,
    assignmentTitle,
  });

  const openCount = useMemo(
    () => requests.filter((request) => request.status === "open").length,
    [requests],
  );

  const handleCreate = async () => {
    const success = await createRequest(requestDraft);
    if (success) {
      setRequestDraft("");
    }
  };

  const handleReply = async (requestId: string) => {
    const success = await addReply(requestId, replyDrafts[requestId] || "");
    if (success) {
      setReplyDrafts((current) => ({
        ...current,
        [requestId]: "",
      }));
    }
  };

  const composer = canCreateRequest ? (
    <div className="rounded-2xl border border-rose-100 dark:border-rose-500/10 bg-rose-50/70 dark:bg-rose-500/5 p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 text-rose-500 shadow-sm">
          <Sparkles className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-900 dark:text-white">Hit a blocker?</p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Post one short request like what part is confusing, what you already tried, or what answer format you need.
          </p>
        </div>
      </div>
      <Textarea
        value={requestDraft}
        onChange={(event) => setRequestDraft(event.target.value)}
        placeholder="Example: I’m stuck on question 2 and I’m not sure how detailed the explanation should be."
        className="min-h-[92px] sm:min-h-[104px] rounded-2xl border-slate-200 dark:border-slate-800 resize-none"
        maxLength={500}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {requestDraft.trim().length}/500
        </span>
        <Button
          onClick={handleCreate}
          disabled={submitting || !requestDraft.trim()}
          className="rounded-2xl h-11 px-5 font-black gap-2 bg-rose-600 hover:bg-rose-700 text-white"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          I’m Stuck
        </Button>
      </div>
    </div>
  ) : null;

  const requestBlocks = loading ? (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-slate-400",
        useContainerHeight && "min-h-[240px]",
      )}
    >
      <Loader2 className="size-5 animate-spin" />
    </div>
  ) : requests.length === 0 ? (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center space-y-2",
        useContainerHeight && "min-h-[240px]",
      )}
    >
      <MessageSquareMore className="size-10 mx-auto text-slate-300 dark:text-slate-700" />
      <p className="font-black text-slate-900 dark:text-white">No live help requests yet</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        The first question posted here becomes visible in real time to the people in this class.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className={cn(
            "rounded-3xl border p-4 sm:p-5 space-y-4 transition-colors",
            request.status === "resolved"
              ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5"
              : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <Avatar className="size-11 border border-white/70 dark:border-slate-800">
                <AvatarImage src={request.requester_avatar || undefined} />
                <AvatarFallback>{initialsFor(request.requester_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-slate-900 dark:text-white truncate">{request.requester_name}</p>
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px] font-black uppercase tracking-wider border-none bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  >
                    {request.requester_role}
                  </Badge>
                  {request.is_own && (
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px] font-black uppercase tracking-wider border-none bg-blue-500/10 text-blue-600 dark:text-blue-300"
                    >
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border-none text-[10px] font-black uppercase tracking-wider",
                  request.status === "resolved"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-300",
                )}
              >
                {request.status}
              </Badge>
              {request.status === "open" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveRequest(request.id)}
                  disabled={resolvingId === request.id}
                  className="rounded-xl h-9 px-3 font-black gap-2"
                >
                  {resolvingId === request.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCheck className="size-4" />
                  )}
                  Resolve
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3">
            <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {request.message}
            </p>
          </div>

          {request.status === "resolved" && request.resolved_at && (
            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
              Resolved {formatDistanceToNow(new Date(request.resolved_at), { addSuffix: true })}
              {request.resolver_name ? ` by ${request.resolver_name}` : ""}
            </div>
          )}

          {request.replies.length > 0 && (
            <div className="space-y-3">
              {request.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="flex items-start gap-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-3 py-3"
                >
                  <Avatar className="size-9">
                    <AvatarImage src={reply.author_avatar || undefined} />
                    <AvatarFallback>{initialsFor(reply.author_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{reply.author_name}</p>
                      {reply.is_own && (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[10px] font-black uppercase tracking-wider border-none bg-blue-500/10 text-blue-600 dark:text-blue-300"
                        >
                          You
                        </Badge>
                      )}
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {reply.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {request.status === "open" ? (
            <div className="space-y-2">
              <Textarea
                value={replyDrafts[request.id] || ""}
                onChange={(event) =>
                  setReplyDrafts((current) => ({
                    ...current,
                    [request.id]: event.target.value,
                  }))
                }
                placeholder="Reply with a quick explanation, hint, or next step..."
                className="min-h-[72px] sm:min-h-[84px] rounded-2xl border-slate-200 dark:border-slate-800 resize-none"
                maxLength={400}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {(replyDrafts[request.id] || "").trim().length}/400
                </span>
                <Button
                  size="sm"
                  onClick={() => handleReply(request.id)}
                  disabled={replyingToId === request.id || !(replyDrafts[request.id] || "").trim()}
                  className="rounded-xl h-10 px-4 font-black gap-2 shrink-0"
                >
                  {replyingToId === request.id ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Reply
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Replies are disabled because this request is resolved.
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Card
      id={anchorId}
      className={cn(
        "border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden scroll-mt-6",
        useContainerHeight && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <CardHeader className={cn("p-5 sm:p-6 pb-3", useContainerHeight && "shrink-0")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-base sm:text-lg font-black">
              <LifeBuoy className="size-5 text-rose-500" />
              Quick Help
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Ask when you’re stuck. Classmates and lecturers can reply here live.
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "w-fit rounded-full px-3 py-1 border-none font-black text-[10px] uppercase tracking-wider",
              openCount > 0
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
            )}
          >
            {openCount > 0 ? `${openCount} open` : "All resolved"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "p-4 sm:p-6 pt-0 space-y-5",
          useContainerHeight && "flex flex-1 flex-col min-h-0 overflow-hidden",
        )}
      >
        {useContainerHeight ? (
          <ScrollArea className="flex-1 min-h-0 h-full pr-2">
            <div className="space-y-5">
              {composer}
              {requestBlocks}
            </div>
          </ScrollArea>
        ) : (
          <>
            {composer}
            {loading || requests.length === 0 ? (
              requestBlocks
            ) : (
              <ScrollArea className="h-[min(520px,calc(100vh-280px))] sm:h-[min(560px,calc(100vh-320px))] pr-2">
                {requestBlocks}
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
