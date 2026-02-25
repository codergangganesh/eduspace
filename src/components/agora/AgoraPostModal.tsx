
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    FileText,
    Video,
    HelpCircle,
    Zap,
    Sparkles,
    Tags,
    Coins
} from 'lucide-react';
import { AgoraPost, AgoraPostType } from './AgoraCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AgoraPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (post: any) => void;
    post?: AgoraPost; // Optional post for editing
}

export const AgoraPostModal: React.FC<AgoraPostModalProps> = ({ isOpen, onClose, onSubmit, post }) => {
    const { user } = useAuth();
    const [type, setType] = useState<AgoraPostType>(post?.type || 'note');
    const [title, setTitle] = useState(post?.title || '');
    const [content, setContent] = useState(post?.content || '');
    const [tags, setTags] = useState(post?.tags?.join(', ') || '');
    const [bounty, setBounty] = useState<string>(post?.bounty?.toString() || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update state when post changes (for editing)
    React.useEffect(() => {
        if (post) {
            setType(post.type);
            setTitle(post.title);
            setContent(post.content);
            setTags(post.tags?.join(', ') || '');
            setBounty(post.bounty?.toString() || '');
        } else {
            resetForm();
        }
    }, [post, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please login to post");
            return;
        }
        if (!title || !content) {
            toast.error("Please fill in the title and content");
            return;
        }

        setIsSubmitting(true);

        try {
            const postData = {
                user_id: user.id,
                title,
                content,
                post_type: type,
                summary: post?.summary || "AI analysis in progress...",
                bounty: bounty ? parseInt(bounty) : 0,
                tags: tags.split(',').map(t => t.trim()).filter(t => t)
            };

            let data, error;

            if (post?.id) {
                // Update existing post
                const { data: updatedData, error: updateError } = await (supabase as any)
                    .from('agora_posts')
                    .update(postData)
                    .eq('id', post.id)
                    .select()
                    .single();
                data = updatedData;
                error = updateError;
            } else {
                // Insert new post
                const { data: insertedData, error: insertError } = await (supabase as any)
                    .from('agora_posts')
                    .insert(postData)
                    .select()
                    .single();
                data = insertedData;
                error = insertError;
            }

            if (error) throw error;

            onSubmit({
                ...data,
                type: data.post_type,
                createdAt: post?.createdAt || 'Just now',
                likes: post?.likes || 0,
                dislikes: post?.dislikes || 0,
                replies: post?.replies || 0,
                author: post?.author || { name: 'You', role: 'student' }
            });

            toast.success(post?.id ? "Resource updated in The Agora!" : "Resource launched to The Agora!");
            if (!post?.id) resetForm();
            onClose();
        } catch (error) {
            console.error("Submission error:", error);
            toast.error(post?.id ? "Failed to update resource" : "Failed to post resource");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setType('note');
        setTitle('');
        setContent('');
        setTags('');
        setBounty('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-none shadow-2xl rounded-[2rem] overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <DialogHeader className="pt-6 px-6">
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="size-6 text-indigo-500" />
                        {post ? 'Edit Resource' : 'Share Knowledge'}
                    </DialogTitle>
                    <DialogDescription className="font-bold text-slate-500">
                        {post ? 'Refine your contribution to The Agora.' : 'Contribute to the collective intelligence of EduSpace.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Title</Label>
                            <Input
                                placeholder="e.g. Advanced Thermodynamics Cheat Sheet"
                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold h-12"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Content</Label>
                            <Textarea
                                placeholder="Describe your resource or explain your question..."
                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold min-h-[120px] resize-none"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                    <Tags className="size-3" /> Tags
                                </Label>
                                <Input
                                    placeholder="Physics, Math (comma separated)"
                                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold h-10"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                                    <Coins className="size-3" /> Bounty (Optional)
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="Points to offer"
                                    className="bg-slate-50 dark:bg-amber-500/5 border-2 border-amber-500/20 rounded-xl font-bold h-10 text-amber-600"
                                    value={bounty}
                                    onChange={(e) => setBounty(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 rounded-2xl font-black h-12"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black h-12 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            {isSubmitting ? "Processing..." : post ? "Update Resource" : "Launch to Agora"}
                        </Button>
                    </div>
                </form>
            </DialogContent >
        </Dialog >
    );
};
