import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Plus, Trash2, Edit2, Save, X, Search, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { knowledgeService } from "@/lib/knowledgeService";
import { cn } from "@/lib/utils";

interface Note {
    id: string;
    title: string;
    content: string;
    created_at: string;
}

export function StudentNotesDrawer() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [newNoteMode, setNewNoteMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        const checkNative = async () => {
            try {
                const { Capacitor } = await import('@capacitor/core');
                setIsNative(Capacitor.isNativePlatform());
            } catch (e) {
                setIsNative(false);
            }
        };
        checkNative();
    }, []);

    // Form State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const fetchNotes = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('student_notes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching notes:", error);
            toast.error("Failed to load notes");
        } else {
            setNotes(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchNotes();
    }, [user]);

    const handleSave = async () => {
        if (!user || !title.trim()) return;

        try {
            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('student_notes')
                    .update({ title, content })
                    .eq('id', isEditing);
                if (updateError) throw updateError;
                toast.success("Note updated");

                knowledgeService.upsertKnowledgeNode({
                    type: 'note',
                    sourceId: isEditing,
                    label: title,
                    text: `${title}\n${content}`
                });
            } else {
                const { data, error: insertError } = await supabase
                    .from('student_notes')
                    .insert({ user_id: user.id, title, content })
                    .select();
                if (insertError) throw insertError;
                toast.success("Note created");

                // Update Knowledge Map with new note
                if (data?.[0]) {
                    knowledgeService.upsertKnowledgeNode({
                        type: 'note',
                        sourceId: data[0].id,
                        label: title,
                        text: `${title}\n${content}`
                    });
                }
            }

            resetForm();
            fetchNotes();
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error("Failed to save note");
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { error } = await supabase.from('student_notes').delete().eq('id', id);
        if (error) {
            toast.error("Failed to delete note");
        } else {
            toast.success("Note deleted");
            setNotes(prev => prev.filter(n => n.id !== id));
            knowledgeService.deleteKnowledgeNode(id);
        }
    };

    const startEdit = (note: Note) => {
        setIsEditing(note.id);
        setTitle(note.title);
        setContent(note.content);
        setNewNoteMode(false);
    };

    const resetForm = () => {
        setIsEditing(null);
        setNewNoteMode(false);
        setTitle("");
        setContent("");
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" title="My Notes">
                    <BookOpen className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side={isNative ? "bottom" : "right"}
                className={cn(
                    "flex flex-col p-0 border-none bg-background shadow-2xl transition-all duration-500 ease-in-out",
                    isNative
                        ? "h-[88dvh] rounded-t-[32px] w-full"
                        : "h-full w-full sm:max-w-md pt-[var(--safe-top)]"
                )}
            >
                {/* Visual Handle for Mobile Bottom Sheet */}
                {isNative && (
                    <div className="flex justify-center pt-3 pb-1 shrink-0">
                        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                    </div>
                )}

                <div className={cn(
                    "flex flex-col h-full",
                    isNative ? "p-0" : "p-4"
                )}>
                    {/* Header Section */}
                    <div className={cn(
                        "flex flex-col gap-4 shrink-0",
                        isNative ? "px-6 pt-6 pb-2 pr-16" : "px-3 mb-8 pr-14"
                    )}>
                        <div className="flex items-center justify-between relative min-h-[44px]">
                            <SheetTitle className={cn(
                                "font-black text-foreground tracking-tight underline-offset-4",
                                isNative ? "text-2xl" : "text-2xl"
                            )}>
                                {isEditing ? "Edit Note" : newNoteMode ? "New Note" : "My Notes"}
                            </SheetTitle>

                            <div className="flex items-center gap-2">
                                {!newNoteMode && !isEditing && !isNative && (
                                    <button
                                        onClick={() => setNewNoteMode(true)}
                                        className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-xl active:scale-95 transition-all"
                                    >
                                        New
                                    </button>
                                )}

                                {(newNoteMode || isEditing) && (
                                    <button
                                        onClick={resetForm}
                                        className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground bg-muted/30 px-4 py-2 rounded-xl active:scale-95 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Search Bar - only in list view */}
                        {!newNoteMode && !isEditing && (
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 transition-colors group-focus-within:text-blue-500" />
                                <Input
                                    placeholder="Search notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cn(
                                        "h-12 pl-11 pr-4 bg-muted/40 border-none rounded-2xl focus-visible:ring-blue-500/20 placeholder:text-muted-foreground/40 font-medium transition-all",
                                        isNative && "bg-slate-300/40 dark:bg-slate-800/60"
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        "flex-1 overflow-hidden flex flex-col pt-2",
                        isNative ? "px-6" : "px-3"
                    )}>
                        {(newNoteMode || isEditing) ? (
                            <div className="flex flex-col gap-4 h-full pb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Title</label>
                                    <Input
                                        placeholder="Note Title"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="font-bold text-lg h-14 rounded-2xl border-none bg-muted/40 focus-visible:ring-blue-500/10 px-4"
                                    />
                                </div>
                                <div className="space-y-1 flex-1 flex flex-col min-h-0">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Content</label>
                                    <Textarea
                                        placeholder="Start typing your note here..."
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        className="flex-1 resize-none rounded-2xl border-none bg-muted/30 p-4 focus-visible:ring-blue-500/10 leading-relaxed text-base"
                                    />
                                </div>
                                <div className="flex justify-end pt-4 pb-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={!title.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 font-black rounded-2xl px-8 h-12 w-full active:scale-[0.98] transition-all"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isEditing ? "Update Note" : "Save Note"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-hidden flex flex-col relative pb-4">
                                <ScrollArea className="flex-1 -mx-4 px-4 mask-fade-bottom">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                                            <div className="animate-spin size-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Refreshing...</p>
                                        </div>
                                    ) : filteredNotes.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-20 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="size-24 bg-muted/30 rounded-full flex items-center justify-center">
                                                <BookOpen className="h-12 w-12 opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-lg text-foreground">Pocket empty</p>
                                                <p className="text-sm font-medium">Capture your lecture highlights here</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {filteredNotes.map(note => (
                                                <div
                                                    key={note.id}
                                                    onClick={() => startEdit(note)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border border-transparent transition-all active:scale-[0.97] group relative overflow-hidden",
                                                        isNative
                                                            ? "bg-slate-200/50 dark:bg-slate-800/40 border-slate-300/30 dark:border-slate-700/30"
                                                            : "bg-muted/5 border-border/10 hover:border-blue-500/30"
                                                    )}
                                                >
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <h3 className="font-bold text-[15px] text-foreground group-hover:text-blue-500 transition-colors line-clamp-1 flex-1">
                                                                {note.title}
                                                            </h3>
                                                            <div className="flex items-center gap-4 shrink-0 pl-2">
                                                                <span className="text-[10px] font-black text-muted-foreground/60 tracking-wider">
                                                                    {format(new Date(note.created_at), 'HH:mm')}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => handleDelete(note.id, e)}
                                                                    className="p-1.5 text-muted-foreground/40 hover:text-red-500 active:scale-90 transition-all"
                                                                    title="Delete Note"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-[13px] text-muted-foreground/70 line-clamp-2 leading-relaxed font-medium">
                                                            {note.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>

                                {/* Large Footer Button for Android - as seen in latest screenshot */}
                                {isNative && !loading && (
                                    <div className="pt-4 px-1 pb-2">
                                        <Button
                                            onClick={() => setNewNoteMode(true)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-base h-16 rounded-[20px] shadow-2xl shadow-blue-600/20 active:scale-[0.98] transition-all gap-2"
                                        >
                                            <Plus className="size-6 stroke-[3px]" />
                                            Create New Note
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
