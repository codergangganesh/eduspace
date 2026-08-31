import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DeviceSession,
  getActiveDeviceSessions,
  registerCurrentDeviceSession,
  terminateOtherSessions,
  terminateSpecificSession,
} from "@/services/sessionManager.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
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

export function ActiveDevicesCard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTerminatingOthers, setIsTerminatingOthers] = useState(false);
  const [terminatingDeviceId, setTerminatingDeviceId] = useState<string | null>(null);
  const [isConfirmAllOpen, setIsConfirmAllOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    void initAndLoad(user.id);

    // Live real-time device sync channel
    const channel = supabase
      .channel(`user_active_devices_sync_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_active_devices",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const list = await getActiveDeviceSessions(user.id);
          setSessions(list);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const initAndLoad = async (userId: string) => {
    setIsLoading(true);
    try {
      // 1. Register or update current device session
      await registerCurrentDeviceSession(userId);
      // 2. Fetch all active device sessions
      const list = await getActiveDeviceSessions(userId);
      setSessions(list);
    } catch (err) {
      console.error("Failed to load device sessions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      const list = await getActiveDeviceSessions(user.id);
      setSessions(list);
      toast.success("Device sessions refreshed.");
    } catch (_err) {
      toast.error("Failed to refresh sessions.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTerminateOthers = async () => {
    if (!user?.id) return;
    setIsTerminatingOthers(true);
    try {
      const res = await terminateOtherSessions(user.id);
      if (res.success) {
        toast.success("Logged out of all other devices successfully.");
        setIsConfirmAllOpen(false);
        // Refresh list
        const updated = await getActiveDeviceSessions(user.id);
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
    if (!user?.id) return;
    setTerminatingDeviceId(deviceId);
    try {
      const res = await terminateSpecificSession(user.id, deviceId);
      if (res.success) {
        toast.success(`Session for ${deviceName} revoked.`);
        const updated = await getActiveDeviceSessions(user.id);
        setSessions(updated);
      } else {
        toast.error(res.error || "Failed to revoke device session.");
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
        return <Smartphone className="size-5 text-indigo-500" />;
      case "tablet":
        return <Tablet className="size-5 text-sky-500" />;
      default:
        return <Laptop className="size-5 text-emerald-500" />;
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Active Devices & Sessions</h3>
              <p className="text-xs text-muted-foreground">
                Manage all laptops, phones, and browsers currently signed into your EduSpace account.
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
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-secondary/40"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {otherSessions.length > 0 && (
            <AlertDialog open={isConfirmAllOpen} onOpenChange={setIsConfirmAllOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isTerminatingOthers}
                  className="h-9 px-3 gap-1.5 text-xs font-bold rounded-xl shadow-sm"
                >
                  <LogOut className="size-3.5" />
                  Log Out Other Devices ({otherSessions.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-destructive/20 bg-background/95 backdrop-blur-xl">
                <AlertDialogHeader className="space-y-2">
                  <div className="size-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <AlertTriangle className="size-6" />
                  </div>
                  <AlertDialogTitle className="text-lg font-bold">
                    Log out of all other devices?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                    This will immediately invalidate login tokens for all other active browsers and mobile devices. You will remain securely logged in on this current browser.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-2">
                  <AlertDialogCancel className="rounded-xl text-xs font-bold">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleTerminateOthers}
                    className="rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isTerminatingOthers ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Logging Out...
                      </>
                    ) : (
                      "Confirm & Log Out Everywhere Else"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-xs font-medium">Inspecting active cryptographic sessions...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Current Device Hero */}
          {currentSession && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.03] p-5 sm:p-6 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    {getDeviceIcon(currentSession.deviceType)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-foreground">
                        {currentSession.deviceName}
                      </span>
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        This Device (Active Now)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-3 flex-wrap">
                      <span>{currentSession.browser}</span>
                      <span>•</span>
                      <span>{currentSession.os}</span>
                      {currentSession.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Globe className="size-3 text-muted-foreground/80" />
                            {currentSession.location}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-muted-foreground/90 shrink-0">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1">
                    <CheckCircle2 className="size-3.5" />
                    Current Active Token
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 font-mono">
                    ID: {currentSession.id.slice(0, 10)}...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Other Devices Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <KeyRound className="size-3.5" />
              Other Recognized Sessions ({otherSessions.length})
            </h4>

            {otherSessions.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-border/80 bg-secondary/10 text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">No other active devices</p>
                <p className="text-xs text-muted-foreground">
                  Your EduSpace account is only signed in on this current browser.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {otherSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-2xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-xl bg-secondary border border-border/60 text-muted-foreground flex items-center justify-center shrink-0">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-foreground">
                          {session.deviceName}
                        </span>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
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
                        <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1 font-mono">
                          <Clock className="size-3" />
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
                      className="h-8 px-3 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-center rounded-xl"
                    >
                      {terminatingDeviceId === session.id ? (
                        <>
                          <Loader2 className="size-3 animate-spin mr-1.5" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <LogOut className="size-3 mr-1.5" />
                          Revoke Access
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
}
