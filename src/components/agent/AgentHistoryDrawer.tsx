import { useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentHistory } from "@/hooks/useAgentHistory";
import { Bot, User, Clock, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AgentHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentHistoryDrawer = ({ isOpen, onClose }: AgentHistoryDrawerProps) => {
  const { history, isLoading, fetchHistory } = useAgentHistory();

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0 gap-0 border-l border-border/50 bg-background/95 backdrop-blur-xl">
        <SheetHeader className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold">Agent History</SheetTitle>
              <SheetDescription className="text-xs">
                View your previous agent conversations
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 pb-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="size-6 animate-spin text-primary/40" />
                <p className="text-xs text-muted-foreground font-medium">Retrieving history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 px-10">
                <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center">
                  <Clock className="size-8 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">No History Yet</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Messages from your conversations will appear here.
                  </p>
                </div>
              </div>
            ) : (
              history.map((msg, idx) => {
                const isAgent = msg.sender === "agent";
                const date = new Date(msg.created_at);
                
                return (
                  <div key={msg.id} className="flex flex-col gap-2">
                    <div className={cn(
                      "flex items-center gap-2 mb-1",
                      isAgent ? "flex-row" : "flex-row-reverse"
                    )}>
                      <div className={cn(
                        "size-6 rounded-full flex items-center justify-center text-[10px]",
                        isAgent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {isAgent ? <Bot className="size-3" /> : <User className="size-3" />}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        {isAgent ? "EduSpace Agent" : "You"}
                      </span>
                      <span className="text-[9px] text-muted-foreground/40 font-medium">
                        {format(date, "MMM d, h:mm a")}
                      </span>
                    </div>
                    
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm shadow-sm border",
                      isAgent 
                        ? "bg-card border-border/40 rounded-tl-sm self-start mr-8" 
                        : "bg-primary/5 border-primary/10 rounded-tr-sm self-end ml-8 text-foreground"
                    )}>
                      <div className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {!isLoading && (
          <div className="shrink-0 py-5 px-6 border-t border-border/40 bg-background/50 backdrop-blur-md flex flex-col items-center justify-center gap-1.5 opacity-60">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500/90 leading-none">
              <span className="size-1 rounded-full bg-rose-500 animate-pulse" />
              Auto-Deletion Active
            </div>
            <p className="text-[10px] font-bold text-rose-400/80 text-center leading-none">
              Messages are automatically removed 7 days after creation.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
