import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, BarChart2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ChatPollDialogProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    onSuccess?: (pollId: string, question: string) => void;
}

export function ChatPollDialog({ isOpen, onClose, conversationId, onSuccess }: ChatPollDialogProps) {
    const { user } = useAuth();
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [loading, setLoading] = useState(false);

    const addOption = () => {
        if (options.length < 5) {
            setOptions([...options, ""]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreatePoll = async () => {
        if (!user || !question.trim() || options.some(o => !o.trim())) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            // 1. Create the poll entry
            const { data: pollData, error: pollError } = await supabase
                .from('chat_polls')
                .insert({
                    conversation_id: conversationId,
                    created_by: user.id,
                    question: question.trim(),
                    options: options.map(o => o.trim()),
                    allow_multiple: allowMultiple
                })
                .select()
                .single();

            if (pollError) throw pollError;

            // 2. Notify parent to send the message Optimistically
            if (onSuccess) {
                onSuccess(pollData.id, question.trim());
            }

            toast.success("Poll created!");
            onClose();
            setQuestion("");
            setOptions(["", ""]);
            setAllowMultiple(false);
        } catch (error) {
            console.error("Error creating poll:", error);
            toast.error("Failed to create poll");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" /> Create Poll
                    </DialogTitle>
                    <DialogDescription>Ask a question and provide options.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Question</label>
                        <Input
                            placeholder="e.g., When should we meet?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Options</label>
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                />
                                {options.length > 2 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                                        <X className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {options.length < 5 && (
                            <Button variant="outline" size="sm" onClick={addOption} className="w-full mt-2">
                                <Plus className="w-4 h-4 mr-2" /> Add Option
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Multiple Selections</label>
                            <p className="text-[10px] text-slate-500 font-medium">Students can select more than one option</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAllowMultiple(!allowMultiple)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${allowMultiple ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${allowMultiple ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="font-bold text-slate-500">Cancel</Button>
                    <Button onClick={handleCreatePoll} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-full">
                        {loading ? "Creating..." : "Create Poll"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
