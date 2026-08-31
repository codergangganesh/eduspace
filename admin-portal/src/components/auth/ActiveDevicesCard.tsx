import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  DeviceSession,
  getActiveAdminSessions,
  registerCurrentAdminSession,
  terminateOtherAdminSessions,
  terminateSpecificAdminSession,
} from "@/services/sessionManager.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  LogOut,
  RefreshCw,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  KeyRound,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

export const ActiveDevicesCard: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTerminatingOthers, setIsTerminatingOthers] = useState(false);
  const [terminatingDeviceId, setTerminatingDeviceId] = useState<string | null>(null);
  const [isConfirmAllOpen, setIsConfirmAllOpen] = useState(false);

  useEffect(() => {
    let channel: any = null;

    const init = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setUserId(user.id);
          await registerCurrentAdminSession(user.id);
          const list = await getActiveAdminSessions(user.id);
          setSessions(list);

          // Subscribe to live device changes
          channel = supabase
            .channel(`admin_active_devices_sync_${user.id}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "user_active_devices",
                filter: `user_id=eq.${user.id}`,
              },
              async () => {
                const updated = await getActiveAdminSessions(user.id);
                setSessions(updated);
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error("Failed to load admin device sessions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void init();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleRefresh = async () => {
    if (!userId) return;
    setIsRefreshing(true);
    try {
      const list = await getActiveAdminSessions(userId);
      setSessions(list);
      toast.success("Active sessions refreshed.");
    } catch (_err) {
      toast.error("Failed to refresh sessions.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTerminateOthers = async () => {
    if (!userId) return;
    setIsTerminatingOthers(true);
    try {
      const res = await terminateOtherAdminSessions(userId);
      if (res.success) {
        toast.success("Successfully logged out of all other admin workstations.");
        setIsConfirmAllOpen(false);
        const updated = await getActiveAdminSessions(userId);
        setSessions(updated);
      } else {
        toast.error(res.error || "Failed to log out of other devices.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsTerminatingOthers(false);
    }
  };

  const handleTerminateSpecific = async (deviceId: string, deviceName: string) => {
    if (!userId) return;
    setTerminatingDeviceId(deviceId);
    try {
      const res = await terminateSpecificAdminSession(userId, deviceId);
      if (res.success) {
        toast.success(`Session for ${deviceName} revoked.`);
        const updated = await getActiveAdminSessions(userId);
        setSessions(updated);
      } else {
        toast.error(res.error || "Failed to revoke session.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke session.");
    } finally {
      setTerminatingDeviceId(null);
    }
  };

  const getDeviceIcon = (type: DeviceSession["deviceType"]) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="h-5 w-5 text-indigo-500" />;
      case "tablet":
        return <Tablet className="h-5 w-5 text-sky-500" />;
      default:
        return <Laptop className="h-5 w-5 text-emerald-500" />;
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Active Admin Workstations & Sessions</h3>
              <p className="text-xs text-muted-foreground">
                Manage all administrative sessions and workstations currently signed into this portal.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="h-8 px-3 gap-1.5 text-xs font-semibold rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {otherSessions.length > 0 && (
            <AlertDialog open={isConfirmAllOpen} onOpenChange={setIsConfirmAllOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isTerminatingOthers}
                  className="h-8 px-3 gap-1.5 text-xs font-bold rounded-lg"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Terminate Other Sessions ({otherSessions.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-destructive/20 bg-background/95 backdrop-blur-xl">
                <AlertDialogHeader className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <AlertDialogTitle className="text-base font-bold">
                    Terminate all other admin sessions?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                    This will invalidate auth tokens for all other administrative devices. This current workstation will remain active.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-2">
                  <AlertDialogCancel className="rounded-lg text-xs font-bold">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleTerminateOthers}
                    className="rounded-lg text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isTerminatingOthers ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Terminating...
                      </>
                    ) : (
                      "Confirm & Terminate Everywhere Else"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Checking active cryptographic sessions...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentSession && (
            <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.03] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    {getDeviceIcon(currentSession.deviceType)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {currentSession.deviceName}
                      </span>
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.2 rounded-full">
                        This Workstation (Active Now)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>{currentSession.browser}</span>
                      <span>•</span>
                      <span>{currentSession.os}</span>
                      {currentSession.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {currentSession.location}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Primary Session
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="h-3 w-3" />
              Other Recognized Sessions ({otherSessions.length})
            </h4>

            {otherSessions.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-secondary/10 text-center">
                <p className="text-xs font-medium text-foreground">No other active admin sessions</p>
                <p className="text-[11px] text-muted-foreground">
                  Your administrator account is only active on this current browser.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {otherSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">
                          {session.deviceName}
                        </span>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span>{session.browser}</span>
                          <span>•</span>
                          <span>{session.os}</span>
                          {session.location && (
                            <>
                              <span>•</span>
                              <span>{session.location}</span>
                            </>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 font-mono">
                          <Clock className="h-2.5 w-2.5" />
                          Last active:{" "}
                          {formatDistanceToNow(new Date(session.lastActiveAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTerminateSpecific(session.id, session.deviceName)}
                      disabled={terminatingDeviceId === session.id}
                      className="h-7 px-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-center rounded-lg"
                    >
                      {terminatingDeviceId === session.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-3 w-3 mr-1" />
                          Revoke
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
