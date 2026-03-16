import React, { useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Paperclip,
    Video,
    FileText,
    Link,
    Play,
    Download,
    ExternalLink,
    Eye,
} from "lucide-react";
import { format } from "date-fns";
import { downloadAssignmentFile } from "@/lib/supabaseStorage";

interface Message {
    id: string;
    content: string;
    attachment_name: string | null;
    attachment_url: string | null;
    attachment_type: string | null;
    attachment_size: string | null;
    created_at: string;
}

interface MediaDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    messages: Message[];
    otherUserName: string;
}

export const MediaDrawer = ({ isOpen, onOpenChange, messages, otherUserName }: MediaDrawerProps) => {
    const media = useMemo(() =>
        messages.filter(m => m.attachment_url && (m.attachment_type?.startsWith('image/') || m.attachment_type?.startsWith('video/')))
    , [messages]);

    const docs = useMemo(() =>
        messages.filter(m => m.attachment_url && !m.attachment_type?.startsWith('image/') && !m.attachment_type?.startsWith('video/'))
    , [messages]);

    const links = useMemo(() =>
        messages.filter(m => m.content.match(/(https?:\/\/[^\s]+)/g))
    , [messages]);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col border-none shadow-2xl dark:bg-[#111b21]">
                <SheetHeader className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3 text-left">
                        <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Paperclip className="size-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">Shared Content</SheetTitle>
                            <SheetDescription className="text-slate-500">Shared with {otherUserName}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="media" className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#111b21]">
                    <TabsList className="grid w-full grid-cols-3 mx-0 px-6 py-0 bg-transparent border-b border-slate-100 dark:border-slate-800 rounded-none h-14">
                        <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full shadow-none font-semibold text-xs uppercase tracking-wider">Media</TabsTrigger>
                        <TabsTrigger value="docs" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full shadow-none font-semibold text-xs uppercase tracking-wider">Docs</TabsTrigger>
                        <TabsTrigger value="links" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full shadow-none font-semibold text-xs uppercase tracking-wider">Links</TabsTrigger>
                    </TabsList>

                    <TabsContent value="media" className="flex-1 overflow-y-auto p-4 focus-visible:ring-0">
                        {media.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center animate-in fade-in duration-500">
                                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Video className="size-8 opacity-20" />
                                </div>
                                <p className="font-medium">No media shared yet</p>
                                <p className="text-xs max-w-[180px] mt-1">Photos and videos will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {media.map((m, i) => (
                                    <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all group relative">
                                        {m.attachment_type?.startsWith('image/') ? (
                                            <img src={m.attachment_url!} className="w-full h-full object-cover" onClick={() => window.open(m.attachment_url!, '_blank')} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center relative" onClick={() => window.open(m.attachment_url!, '_blank')}>
                                                <Play className="size-6 text-white absolute z-10 drop-shadow-lg" />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                                <img src={m.attachment_url! + "#t=0.5"} className="w-full h-full object-cover" alt="Video thumbnail" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="docs" className="flex-1 overflow-y-auto p-4 space-y-2 focus-visible:ring-0">
                        {docs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center animate-in fade-in duration-500">
                                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="size-8 opacity-20" />
                                </div>
                                <p className="font-medium">No documents shared yet</p>
                                <p className="text-xs max-w-[180px] mt-1">PDFs and other files will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {docs.map((m, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 group/item transition-all">
                                        <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <FileText className="size-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <p className="text-sm font-semibold truncate">{m.attachment_name || 'Document'}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{m.attachment_size} • {m.attachment_type?.split('/')[1] || 'FILE'}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                title="View"
                                                onClick={() => window.open(m.attachment_url!, '_blank')}
                                                className="size-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-blue-500"
                                            >
                                                <Eye className="size-4" />
                                            </button>
                                            <button 
                                                title="Download"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadAssignmentFile(m.attachment_url!, m.attachment_name || 'document', 'message-attachments');
                                                }}
                                                className="size-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-emerald-500"
                                            >
                                                <Download className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="links" className="flex-1 overflow-y-auto p-4 space-y-2 focus-visible:ring-0">
                        {links.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center animate-in fade-in duration-500">
                                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Link className="size-8 opacity-20" />
                                </div>
                                <p className="font-medium">No links shared yet</p>
                                <p className="text-xs max-w-[180px] mt-1">Links from your messages will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {links.map((m, i) => {
                                    const urls = m.content.match(/(https?:\/\/[^\s]+)/g);
                                    return urls?.map((url: string, ui: number) => (
                                        <div key={`${i}-${ui}`} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" onClick={() => window.open(url, '_blank')}>
                                            <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <Link className="size-6 text-emerald-500" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <p className="text-sm font-semibold truncate text-emerald-600 dark:text-emerald-400">{url}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                                            </div>
                                            <div className="size-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400">
                                                <ExternalLink className="size-4" />
                                            </div>
                                        </div>
                                    ));
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
};
