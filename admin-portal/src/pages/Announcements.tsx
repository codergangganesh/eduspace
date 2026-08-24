import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  announcementsService,
  AnnouncementAudience,
  AttachmentType,
  AttachedMedia,
} from "@/services/announcements.service";
import { studentsService } from "@/services/students.service";
import { coursesService } from "@/services/courses.service";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Megaphone,
  Send,
  Users,
  CheckCircle2,
  History,
  RefreshCw,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  X,
  Loader2,
  Save,
  RotateCcw,
  Eye,
  Trash2,
  Clock,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ExportButton } from "@/components/common/ExportButton";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const DRAFT_STORAGE_KEY = "eduspace_announcement_draft";

export const Announcements: React.FC = () => {
  // Load draft values if available
  const initialDraft = (() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return null;
  })();

  const [title, setTitle] = useState(initialDraft?.title || "");
  const [message, setMessage] = useState(initialDraft?.message || "");
  const [audience, setAudience] = useState<AnnouncementAudience>(initialDraft?.audience || "all");
  const [targetId, setTargetId] = useState(initialDraft?.targetId || "");

  // Multiple Attached Media Files
  const [attachedFiles, setAttachedFiles] = useState<AttachedMedia[]>(() => {
    if (initialDraft?.attachedFiles && Array.isArray(initialDraft.attachedFiles)) {
      return initialDraft.attachedFiles;
    }
    if (initialDraft?.attachedFile) {
      return [initialDraft.attachedFile];
    }
    return [];
  });

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    if (initialDraft?.timestamp) {
      return new Date(initialDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  });

  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dedicated upload loading states per media type
  const [uploadingType, setUploadingType] = useState<AttachmentType | null>(null);

  // Drawer / View State
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

  // Delete State
  const [announcementToDelete, setAnnouncementToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Separate File Input References
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPrerequisites();
    loadHistory();
  }, []);

  // Auto-Save Draft to LocalStorage whenever content changes
  useEffect(() => {
    const hasContent = title.trim() || message.trim() || targetId || attachedFiles.length > 0;
    if (hasContent) {
      const draft = {
        title,
        message,
        audience,
        targetId,
        attachedFiles,
        timestamp: new Date().toISOString(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(now);
      } catch { }
    }
  }, [title, message, audience, targetId, attachedFiles]);

  const clearDraft = () => {
    setTitle("");
    setMessage("");
    setAudience("all");
    setTargetId("");
    setAttachedFiles([]);
    setLastSavedTime(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch { }
    toast.info("Announcement draft cleared.");
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index));
    toast.info("Attachment removed.");
  };

  const loadPrerequisites = async () => {
    try {
      const [depts, clsRes] = await Promise.all([
        studentsService.getAllDepartments(),
        coursesService.getClasses({ pageSize: 100 }),
      ]);
      setDepartments(depts);
      setClasses(clsRes.data || []);
    } catch (err) {
      console.error("Error loading announcement options:", err);
    }
  };

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await announcementsService.getAnnouncementHistory();
      setHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([loadPrerequisites(), loadHistory()]);
      toast.success("Announcements data refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh announcements data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Recalculate recipient count whenever audience or targetId changes
  useEffect(() => {
    const fetchCount = async () => {
      const count = await announcementsService.getRecipientCount(audience, targetId);
      setRecipientCount(count);
    };
    fetchCount();
  }, [audience, targetId]);

  // Specific file handler for Image, Audio, or Video
  const handleSpecificUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: AttachmentType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be under 50 MB.");
      return;
    }

    try {
      setUploadingType(type);
      const uploaded = await uploadToCloudinary(file);
      const newFile: AttachedMedia = {
        url: uploaded.url,
        name: uploaded.name,
        type: type,
        size: uploaded.size,
      };
      setAttachedFiles((prev) => [...prev, newFile]);
      toast.success(`${type.toUpperCase()} uploaded successfully!`);
    } catch (err: any) {
      console.error("Media upload error:", err);
      toast.error(err.message || `Failed to upload ${type} file.`);
    } finally {
      setUploadingType(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a title and message body.");
      return;
    }

    if ((audience === "department" || audience === "class") && !targetId) {
      toast.error("Please select the specific department or class.");
      return;
    }

    try {
      setIsSending(true);
      const res = await announcementsService.sendAnnouncement({
        title,
        message,
        audience,
        targetId: targetId || undefined,
        attachments: attachedFiles,
        attachmentUrl: attachedFiles[0]?.url,
        attachmentType: attachedFiles[0]?.type,
        attachmentName: attachedFiles[0]?.name,
      });

      if (res.success) {
        toast.success(`Announcement broadcast successfully to ${res.count} recipients!`);
        clearDraft();
        loadHistory();
      } else {
        toast.error(res.error || "Failed to send announcement.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send announcement.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle Permanent Deletion across platform
  const confirmDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    try {
      setIsDeleting(true);
      const res = await announcementsService.deleteAnnouncement({
        id: announcementToDelete.id,
        title: announcementToDelete.title,
      });

      if (res.success) {
        toast.success("Announcement permanently deleted across all user accounts & class feeds.");
        if (selectedAnnouncement?.id === announcementToDelete.id || selectedAnnouncement?.title === announcementToDelete.title) {
          setSelectedAnnouncement(null);
        }
        setAnnouncementToDelete(null);
        loadHistory();
      } else {
        toast.error(res.error || "Failed to delete announcement.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete announcement.");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCols = [
    { header: "Title", key: "title", width: 25 },
    { header: "Message", key: "message", width: 35 },
    { header: "Audience", key: "audience", width: 15 },
    { header: "Recipients", key: "total", width: 12 },
    { header: "Read Count", key: "read", width: 12 },
    { header: "Sent At", key: "created_at", width: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Dedicated Hidden Image Input */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleSpecificUpload(e, "image")}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
      />

      {/* 2. Dedicated Hidden Audio Input */}
      <input
        type="file"
        ref={audioInputRef}
        onChange={(e) => handleSpecificUpload(e, "audio")}
        accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/webm,audio/*"
        className="hidden"
      />

      {/* 3. Dedicated Hidden Video Input */}
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => handleSpecificUpload(e, "video")}
        accept="video/mp4,video/webm,video/mov,video/quicktime,video/m4v,video/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate">
              Platform Announcements
            </h1>
            <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 whitespace-nowrap">
              Broadcasts
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
            Dispatch official announcements with Image, Audio voice notes, and Video messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent min-w-[95px]"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <ExportButton data={history} columns={exportCols} filename="eduspace-announcements" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Compose Form */}
        <Card className="lg:col-span-6 border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                Compose Notice
              </CardTitle>

              <div className="flex items-center gap-2">
                {/* Estimated Reach */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                  <Users className="h-3.5 w-3.5" />
                  {recipientCount} Recipients
                </span>

                {/* Auto-save status */}
                {lastSavedTime && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                    <Save className="h-3 w-3 text-emerald-500" />
                    Auto-save {lastSavedTime}
                  </span>
                )}

                {/* Reset */}
                {(title || message || attachedFiles.length > 0) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearDraft}
                    className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-rose-500"
                    title="Clear current draft"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </div>            <CardDescription className="text-xs">
              Broadcast an announcement across user groups with auto-saved drafts.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Announcement Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Campus Event Update or Lecture Voice Note"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Audience</Label>
                <Select
                  value={audience}
                  onValueChange={(val: AnnouncementAudience) => {
                    setAudience(val);
                    setTargetId("");
                  }}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone (All Students & Faculty)</SelectItem>
                    <SelectItem value="students">All Enrolled Students Only</SelectItem>
                    <SelectItem value="lecturers">All Faculty / Lecturers Only</SelectItem>
                    <SelectItem value="department">Specific Academic Department</SelectItem>
                    <SelectItem value="class">Specific Class Section</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {audience === "department" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <Label className="text-xs font-semibold">Select Department</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Choose department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {audience === "class" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <Label className="text-xs font-semibold">Select Class</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Choose classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name || cls.course_code} ({cls.lecturer_name || "Faculty"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Message Body</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message details here..."
                  className="min-h-[100px] text-sm resize-y"
                  required
                />
              </div>

              {/* Uploaded Media Files List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span>Attached Media</span>
                    {attachedFiles.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                        {attachedFiles.length}
                      </span>
                    )}
                  </Label>
                  <span className="text-[11px] font-normal text-muted-foreground">Max 50MB per file</span>
                </div>

                {/* Render Attached Files Cards */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-border/80 bg-muted/30 space-y-2 animate-in fade-in duration-150"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                              {file.type === "image" && <ImageIcon className="h-4 w-4 text-sky-500" />}
                              {file.type === "audio" && <Music className="h-4 w-4 text-emerald-500" />}
                              {file.type === "video" && <Video className="h-4 w-4 text-purple-500" />}
                              {file.type === "file" && <FileText className="h-4 w-4 text-primary" />}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{file.type} {file.size ? `• ${file.size}` : ""}</p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(idx)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                            title="Remove file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Inline Previews */}
                        {file.type === "image" && (
                          <div className="rounded-lg overflow-hidden border border-border/60 max-h-36 bg-black/5 flex items-center justify-center">
                            <img src={file.url} alt="Uploaded preview" className="max-h-36 w-full object-contain" />
                          </div>
                        )}

                        {file.type === "audio" && (
                          <audio controls src={file.url} className="w-full h-8 pt-0.5" />
                        )}

                        {file.type === "video" && (
                          <div className="rounded-lg overflow-hidden border border-border/60 bg-black">
                            <video controls src={file.url} className="w-full max-h-40 object-contain" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3 Upload Buttons: ALWAYS VISIBLE to add more images/audio/video */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Image Upload Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!!uploadingType}
                    className="h-14 border-dashed border-sky-500/30 hover:border-sky-500/70 hover:bg-sky-500/5 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
                  >
                    {uploadingType === "image" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-sky-500" />
                    )}
                    <span className="text-[11px] font-semibold text-foreground">+ Add Image</span>
                    <span className="text-[9px] text-muted-foreground font-mono">PNG, JPG, GIF</span>
                  </Button>

                  {/* Audio Upload Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={!!uploadingType}
                    className="h-14 border-dashed border-emerald-500/30 hover:border-emerald-500/70 hover:bg-emerald-500/5 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
                  >
                    {uploadingType === "audio" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    ) : (
                      <Music className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="text-[11px] font-semibold text-foreground">+ Add Audio</span>
                    <span className="text-[9px] text-muted-foreground font-mono">MP3, WAV, Voice</span>
                  </Button>

                  {/* Video Upload Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={!!uploadingType}
                    className="h-14 border-dashed border-purple-500/30 hover:border-purple-500/70 hover:bg-purple-500/5 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
                  >
                    {uploadingType === "video" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    ) : (
                      <Video className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="text-[11px] font-semibold text-foreground">+ Add Video</span>
                    <span className="text-[9px] text-muted-foreground font-mono">MP4, WebM, MOV</span>
                  </Button>
                </div>
              </div>

              {/* Recipient Count Indicator */}


              <Button
                type="submit"
                className="w-full h-10 font-semibold shadow-md shadow-primary/20"
                disabled={isSending || !!uploadingType || recipientCount === 0}
              >
                {isSending ? (
                  "Broadcasting..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Broadcast Announcement Now
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: History */}
        <Card className="lg:col-span-6 border-border bg-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Past Broadcasts
            </CardTitle>
            <CardDescription className="text-xs">
              Review previously dispatched announcements, view full details, or remove platform-wide.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[660px]">
            {isLoadingHistory ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No announcements sent"
                description="Broadcasted announcements and their attached media will appear here."
              />
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => {
                  const readPercent =
                    item.total > 0 ? Math.round((item.read / item.total) * 100) : 0;
                  const itemMediaList: AttachedMedia[] = item.attachments && item.attachments.length > 0
                    ? item.attachments
                    : item.attachment_url
                      ? [{ url: item.attachment_url, type: item.attachment_type, name: item.attachment_name || "Attachment" }]
                      : [];

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2.5 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-foreground line-clamp-1">{item.title}</h4>
                          {itemMediaList.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {itemMediaList.map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-primary/10 text-primary capitalize"
                                >
                                  {m.type === "image" && <ImageIcon className="h-3 w-3 text-sky-500" />}
                                  {m.type === "audio" && <Music className="h-3 w-3 text-emerald-500" />}
                                  {m.type === "video" && <Video className="h-3 w-3 text-purple-500" />}
                                  {m.type}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      {/* Quick Media Previews */}
                      {itemMediaList.length > 0 && (
                        <div className="pt-1">
                          {itemMediaList[0].type === "image" && (
                            <div className="rounded-lg overflow-hidden border border-border/80 max-h-24 bg-black/5">
                              <img
                                src={itemMediaList[0].url}
                                alt="Announcement attachment"
                                className="max-h-24 w-full object-cover"
                              />
                            </div>
                          )}
                          {itemMediaList[0].type === "audio" && (
                            <audio controls src={itemMediaList[0].url} className="w-full h-8" />
                          )}
                          {itemMediaList[0].type === "video" && (
                            <div className="rounded-lg overflow-hidden border border-border/80 bg-black max-h-28 flex items-center justify-center">
                              <video src={itemMediaList[0].url} className="max-h-28 object-contain" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Delivered to: <strong className="text-foreground">{item.total}</strong> users
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAnnouncement(item)}
                            className="h-7 text-xs font-semibold hover:bg-primary/10 hover:text-primary gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAnnouncementToDelete(item)}
                            className="h-7 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Right-Side Drawer / Sheet for Full Announcement View ───────────────── */}
      <Sheet open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto space-y-6">
          <SheetHeader className="space-y-1.5 text-left items-start pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Official Broadcast
              </span>
              {selectedAnnouncement?.created_at && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(selectedAnnouncement.created_at)}
                </span>
              )}
            </div>
            <SheetTitle className="text-base sm:text-lg font-bold text-foreground text-left leading-tight break-words">
              {selectedAnnouncement?.title}
            </SheetTitle>
            <SheetDescription className="text-xs text-left text-muted-foreground">
              Sent to {selectedAnnouncement?.total || 0} user accounts and pinned to Class Feeds.
            </SheetDescription>
          </SheetHeader>

          {/* Delivery & Read Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Total Recipients</span>
              <p className="text-lg font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                {selectedAnnouncement?.total || 0}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Audience Scope</span>
              <p className="text-sm font-bold text-foreground capitalize">
                {selectedAnnouncement?.audience || "All Platform"}
              </p>
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Announcement Message</Label>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {selectedAnnouncement?.message}
            </div>
          </div>

          {/* Attached Media Full Gallery */}
          {(() => {
            const mediaList: AttachedMedia[] = selectedAnnouncement?.attachments && selectedAnnouncement.attachments.length > 0
              ? selectedAnnouncement.attachments
              : selectedAnnouncement?.attachment_url
                ? [{ url: selectedAnnouncement.attachment_url, type: selectedAnnouncement.attachment_type, name: selectedAnnouncement.attachment_name || "Attachment" }]
                : [];

            if (mediaList.length === 0) return null;

            return (
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-foreground">Attached Media ({mediaList.length})</Label>
                <div className="space-y-3">
                  {mediaList.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 truncate">
                          {m.type === "image" && <ImageIcon className="h-3.5 w-3.5 text-sky-500" />}
                          {m.type === "audio" && <Music className="h-3.5 w-3.5 text-emerald-500" />}
                          {m.type === "video" && <Video className="h-3.5 w-3.5 text-purple-500" />}
                          {m.name || `${m.type} file`}
                        </span>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>
                      </div>

                      {m.type === "image" && (
                        <div className="rounded-lg overflow-hidden border border-border/80 bg-black/5 max-h-64 flex items-center justify-center">
                          <img
                            src={m.url}
                            alt="Attachment"
                            className="max-h-64 w-full object-contain cursor-pointer hover:opacity-95"
                            onClick={() => window.open(m.url, "_blank")}
                          />
                        </div>
                      )}

                      {m.type === "audio" && (
                        <audio controls src={m.url} className="w-full h-10" />
                      )}

                      {m.type === "video" && (
                        <div className="rounded-lg overflow-hidden border border-border/80 bg-black max-h-64">
                          <video controls src={m.url} className="w-full max-h-64 object-contain" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Drawer Actions */}
          <SheetFooter className="pt-4 border-t flex flex-row items-center justify-between gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setAnnouncementToDelete(selectedAnnouncement);
              }}
              className="font-semibold text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Announcement
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAnnouncement(null)}
              className="text-xs"
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────────── */}
      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="text-base font-bold text-foreground">
                Delete Broadcast Announcement?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground pt-1">
              Are you sure you want to delete <strong className="text-foreground">"{announcementToDelete?.title}"</strong>?
              <br /><br />
              This will <strong className="text-rose-600 dark:text-rose-400">permanently remove</strong> the announcement and all its attached media from:
              <ul className="list-disc pl-5 pt-1 space-y-0.5 text-[11px]">
                <li>All student and lecturer notification centers</li>
                <li>Pinned posts in all active Class Feeds</li>
                <li>Administrative audit logs</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAnnouncement}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete Platform-Wide"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
