import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuizQuestion, QuizOption } from "@/types/quiz";
import { Plus, Trash, GripVertical, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

interface QuestionEditorProps {
    question?: QuizQuestion;
    onSave: (question: QuizQuestion) => void;
    onCancel: () => void;
    questionNumber: number;
}

export function QuestionEditor({ question, onSave, onCancel, questionNumber }: QuestionEditorProps) {
    const [text, setText] = useState(question?.question_text || "");
    const [marks, setMarks] = useState(question?.marks || 1);
    const [options, setOptions] = useState<QuizOption[]>(
        question?.options || [
            { id: generateId(), text: "" },
            { id: generateId(), text: "" }
        ]
    );
    const [correctAnswerId, setCorrectAnswerId] = useState(question?.correct_answer || "");

    // Set first option as correct by default if not set
    useEffect(() => {
        if (!correctAnswerId && options.length > 0) {
            setCorrectAnswerId(options[0].id);
        }
    }, [options, correctAnswerId]);

    const handleAddOption = () => {
        setOptions([...options, { id: generateId(), text: "" }]);
    };

    const handleRemoveOption = (id: string) => {
        if (options.length <= 2) return;
        setOptions(options.filter(o => o.id !== id));
        if (correctAnswerId === id) {
            setCorrectAnswerId(options.find(o => o.id !== id)?.id || "");
        }
    };

    const handleOptionTextChange = (id: string, newText: string) => {
        setOptions(options.map(o => o.id === id ? { ...o, text: newText } : o));
    };

    const handleSave = () => {
        if (!text.trim() || !correctAnswerId) return;

        const newQuestion: QuizQuestion = {
            id: question?.id || generateId(),
            quiz_id: question?.quiz_id || "", // Will be set by parent
            question_text: text,
            question_type: 'multiple_choice',
            marks: marks,
            options: options.filter(o => o.text.trim() !== ""), // Filter empty? No, let user decide
            correct_answer: correctAnswerId,
            order_index: question?.order_index || 0
        };
        onSave(newQuestion);
    };

    return (
        <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-center">
                    <span>Question {questionNumber}</span>
                    <Badge variant="outline">Multiple Choice</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter your question here..."
                        className="min-h-[80px]"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Marks</Label>
                        <Input
                            type="number"
                            min={1}
                            value={marks}
                            onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                            className="w-20 text-center"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Options</Label>
                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={option.id} className="flex items-center gap-2">
                                <div className="mt-1 size-2 rounded-full bg-muted-foreground/30" />
                                <Input
                                    value={option.text}
                                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className=""
                                />
                                {options.length > 2 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveOption(option.id)}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash className="size-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddOption}
                        className="text-primary hover:text-primary/80"
                    >
                        <Plus className="size-4 mr-2" />
                        Add Option
                    </Button>
                </div>

                <div className="space-y-2 pt-4 border-t">
                    <Label>Correct Answer</Label>
                    <Select value={correctAnswerId} onValueChange={setCorrectAnswerId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select the correct option" />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option, index) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.text.trim() ? option.text : `Option ${index + 1}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select the correct option from the list above.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!text.trim()}>Save Question</Button>
                </div>
            </CardContent>
        </Card>
    );
}
