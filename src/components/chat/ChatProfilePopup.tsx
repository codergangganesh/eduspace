import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Info, Image as ImageIcon, MessageSquare, Phone, Video, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatProfilePopupProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    userName: string;
    userAvatar: string;
    onShowMedia: () => void;
}

export const ChatProfilePopup = ({
    isOpen,
    onOpenChange,
    userName,
    userAvatar,
    onShowMedia,
}: ChatProfilePopupProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 overflow-visible md:overflow-hidden bg-transparent border-none shadow-none sm:max-w-[320px] md:max-w-[320px] gap-0 outline-none flex items-center justify-center">
                <DialogTitle className="sr-only">Profile Preview</DialogTitle>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Desktop View (Square WhatsApp Style) */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="hidden md:flex relative flex-col items-center shadow-2xl rounded-2xl overflow-hidden w-full bg-white dark:bg-[#1f2c34]"
                            >
                                {/* Profile Image Container */}
                                <div className="relative w-full aspect-square bg-[#111b21] group">
                                    <Avatar className="w-full h-full rounded-none">
                                        <AvatarImage src={userAvatar} className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <AvatarFallback className="text-6xl bg-emerald-600 text-white font-bold rounded-none">
                                            {userName.split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Name Overlay (Top) */}
                                    <div
                                        className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent text-white cursor-pointer group/name z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenChange(false);
                                            onShowMedia();
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium truncate drop-shadow-md">
                                                {userName}
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Action Bar */}
                                <div className="w-full bg-white dark:bg-[#1f2c34] p-1.5 flex justify-around items-center border-t border-slate-100 dark:border-slate-700/50">
                                    <Button variant="ghost" size="icon" className="size-11 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                                        <MessageSquare className="size-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-11 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                                        <Phone className="size-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-11 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                                        <Video className="size-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-11 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                        onClick={() => {
                                            onOpenChange(false);
                                            onShowMedia();
                                        }}
                                    >
                                        <Info className="size-5" />
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Mobile View (Circular Floating Style) */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="md:hidden relative flex flex-col items-center w-full max-w-[320px] mx-auto"
                            >
                                {/* Profile Image with Gradient Border */}
                                <div className="relative group mb-6">
                                    <div className="relative size-44 p-1.5 rounded-full bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-500">
                                        <div className="w-full h-full rounded-full border-4 border-[#0b141a] overflow-hidden bg-[#111b21]">
                                            <Avatar className="w-full h-full rounded-none">
                                                <AvatarImage src={userAvatar} className="object-cover transition-transform duration-500" />
                                                <AvatarFallback className="text-6xl bg-emerald-600 text-white font-bold">
                                                    {userName.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="absolute bottom-[10%] right-[10%] size-5 bg-emerald-500 rounded-full border-4 border-[#0b141a] z-20 shadow-lg" />
                                    </div>
                                </div>

                                {/* Name & Info */}
                                <div className="text-center mb-8 px-4">
                                    <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-xl">{userName}</h3>
                                    <p className="text-sm text-emerald-400 font-medium tracking-wide drop-shadow-md">Online</p>
                                </div>

                                {/* Action Bar Pill */}
                                <div className="w-[95%] bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-3 flex justify-around items-center shadow-2xl">
                                    <div className="flex flex-col items-center gap-1">
                                        <Button variant="ghost" size="icon" className="size-12 rounded-full text-emerald-500 hover:bg-emerald-500/20" onClick={() => onOpenChange(false)}>
                                            <MessageSquare className="size-6" />
                                        </Button>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">Message</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Button variant="ghost" size="icon" className="size-12 rounded-full text-emerald-500 hover:bg-emerald-500/20">
                                            <Phone className="size-6" />
                                        </Button>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">Audio</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Button variant="ghost" size="icon" className="size-12 rounded-full text-emerald-500 hover:bg-emerald-500/20">
                                            <Video className="size-6" />
                                        </Button>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">Video</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Button variant="ghost" size="icon" className="size-12 rounded-full text-emerald-500 hover:bg-emerald-500/20" onClick={() => { onOpenChange(false); onShowMedia(); }}>
                                            <Info className="size-6" />
                                        </Button>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">Info</span>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};
