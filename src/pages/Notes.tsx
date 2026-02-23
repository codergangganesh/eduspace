import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Plus, Trash2, Edit2, Save, X, Search, Clock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { knowledgeService } from "@/lib/knowledgeService";
import { cn } from "@/lib/utils";

interface Note {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at?: string;
}

export default function Notes() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [newNoteMode, setNewNoteMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Form State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const fetchNotes = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error: any) {
            console.error("Error fetching notes:", error);
            toast.error("Failed to load notes");
        } finally {
            setLoading(false);
        }
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
        <DashboardLayout fullHeight>
            <div className="flex flex-col h-[100dvh] lg:h-[calc(100dvh-64px)] bg-slate-50/50 dark:bg-transparent overflow-hidden pt-[var(--safe-top)]">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 border-b border-border/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="size-10 sm:size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <BookOpen className="size-5 sm:size-6 text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight">My Notes</h1>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{notes.length} Total Notes</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-11 border-border/50 bg-white/50 dark:bg-slate-800/50 rounded-xl focus-visible:ring-indigo-500/20"
                            />
                        </div>
                        <Button
                            onClick={() => setNewNoteMode(true)}
                            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 gap-2 shrink-0"
                        >
                            <Plus className="size-5" />
                            <span className="hidden sm:inline">New Note</span>
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Notes Grid/List */}
                    {(newNoteMode || isEditing) ? (
                        <div className="flex-1 flex flex-col p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Edit2 className="size-6 text-indigo-500" />
                                    {isEditing ? 'Editing Note' : 'Create New Note'}
                                </h2>
                                <Button variant="ghost" onClick={resetForm} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <X className="mr-2 size-4" /> Cancel
                                </Button>
                            </div>

                            <div className="space-y-6 flex-1 flex flex-col">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Title</label>
                                    <Input
                                        placeholder="Note Title"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="text-xl sm:text-2xl font-black h-16 rounded-2xl border-border/50 bg-white dark:bg-slate-900 focus-visible:ring-indigo-500/20 px-6"
                                    />
                                </div>

                                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Content</label>
                                    <Textarea
                                        placeholder="Start typing your thoughts here..."
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        className="flex-1 resize-none rounded-2xl border-border/50 bg-white dark:bg-slate-900 p-6 text-lg focus-visible:ring-indigo-500/20 leading-relaxed overflow-y-auto"
                                    />
                                </div>

                                <div className="flex justify-end pt-4 gap-4 pb-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={!title.trim()}
                                        size="lg"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 font-black rounded-2xl px-12 h-14 text-lg"
                                    >
                                        <Save className="h-5 w-5 mr-3" /> Save Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 px-4 sm:px-8 py-6">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-48 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredNotes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                                    {filteredNotes.map(note => (
                                        <div
                                            key={note.id}
                                            onClick={() => startEdit(note)}
                                            className="group bg-white dark:bg-slate-900 border border-border/50 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden active:scale-[0.98]"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => handleDelete(note.id, e)}
                                                    className="size-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>

                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">
                                                    <Clock className="size-3" />
                                                    {format(new Date(note.created_at), "MMM d, yyyy")}
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-500 transition-colors">
                                                    {note.title}
                                                </h3>
                                            </div>

                                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-4 flex-1">
                                                {note.content || "Empty Note"}
                                            </p>

                                            <div className="mt-6 pt-4 border-t border-border/10 flex items-center justify-between text-indigo-500">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">View Details</span>
                                                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="size-20 bg-indigo-500/10 rounded-[40px] flex items-center justify-center mb-6">
                                        <BookOpen className="size-10 text-indigo-500/40" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-400">No notes found</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-8 font-medium">Capture your thoughts, ideas, and lecture highlights in one place.</p>
                                    <Button
                                        onClick={() => setNewNoteMode(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl px-8 h-12"
                                    >
                                        <Plus className="size-5 mr-2" /> Start Writing
                                    </Button>
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
