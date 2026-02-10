import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

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
                const { error } = await supabase
                    .from('student_notes')
                    .update({ title, content })
                    .eq('id', isEditing);
                if (error) throw error;
                toast.success("Note updated");
            } else {
                const { error } = await supabase
                    .from('student_notes')
                    .insert({ user_id: user.id, title, content });
                if (error) throw error;
                toast.success("Note created");
            }

            resetForm();
            fetchNotes();
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error("Failed to save note");
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('student_notes').delete().eq('id', id);
        if (error) {
            toast.error("Failed to delete note");
        } else {
            toast.success("Note deleted");
            setNotes(prev => prev.filter(n => n.id !== id));
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

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" title="My Notes">
                    <BookOpen className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader className="mb-4">
                    <SheetTitle className="flex items-center justify-between pr-8">
                        <span>My Notes</span>
                        {!newNoteMode && !isEditing && (
                            <Button size="sm" onClick={() => setNewNoteMode(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="h-4 w-4" /> New Note
                            </Button>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {(newNoteMode || isEditing) ? (
                        <div className="flex flex-col gap-4 h-full">
                            <Input
                                placeholder="Note Title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="font-semibold text-lg"
                            />
                            <Textarea
                                placeholder="Start typing your note here..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="flex-1 resize-none"
                            />
                            <div className="flex justify-end gap-2 mt-auto pt-4">
                                <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                                <Button onClick={handleSave} disabled={!title.trim()} className="bg-emerald-600">
                                    <Save className="h-4 w-4 mr-2" /> Save Note
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            {loading ? (
                                <div className="text-center text-muted-foreground py-8">Loading notes...</div>
                            ) : notes.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-2">
                                    <BookOpen className="h-12 w-12 opacity-20" />
                                    <p>No notes yet</p>
                                    <Button variant="link" onClick={() => setNewNoteMode(true)}>Create your first note</Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {notes.map(note => (
                                        <div key={note.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-colors group relative bg-card">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold">{note.title}</h3>
                                                <span className="text-xs text-muted-foreground">{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-2">{note.content}</p>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card/80 backdrop-blur-sm rounded-md p-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(note)}>
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => handleDelete(note.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
