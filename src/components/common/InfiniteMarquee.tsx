import { motion } from "framer-motion";

interface InfiniteMarqueeProps {
    text: string;
    speed?: number;
    className?: string;
    direction?: 'left' | 'right';
}

export function InfiniteMarquee({ text, speed = 20, className, direction = 'left' }: InfiniteMarqueeProps) {
    const words = Array(10).fill(text);

    return (
        <div className="relative flex overflow-hidden whitespace-nowrap py-2 w-full">
            <motion.div
                initial={{ x: direction === 'left' ? 0 : "-50%" }}
                animate={{ x: direction === 'left' ? "-50%" : 0 }}
                transition={{
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className={`flex gap-8 px-4 ${className}`}
            >
                {words.map((w, i) => (
                    <span key={i} className="flex items-center gap-8 italic font-black uppercase tracking-tighter">
                        {w}
                        <span className="size-2 rounded-full bg-primary/30" />
                    </span>
                ))}
                {words.map((w, i) => (
                    <span key={`dup-${i}`} className="flex items-center gap-8 italic font-black uppercase tracking-tighter">
                        {w}
                        <span className="size-2 rounded-full bg-primary/30" />
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
