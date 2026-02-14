import { useState, useEffect } from "react";

interface TypewriterNameProps {
    name: string;
    className?: string;
}

export function TypewriterName({ name, className }: TypewriterNameProps) {
    const [displayText, setDisplayText] = useState("");
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const type = (index: number) => {
            if (index <= name.length) {
                setDisplayText(name.substring(0, index));
                timeout = setTimeout(() => type(index + 1), 100);
            } else {
                setIsTyping(false);
            }
        };

        const startTyping = () => {
            setDisplayText("");
            setIsTyping(true);
            type(0);
        };

        // Initial type
        startTyping();

        // Re-trigger every 5 minutes (300,000 ms)
        const interval = setInterval(() => {
            startTyping();
        }, 300000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [name]);

    return (
        <span className={className}>
            {displayText}
            {isTyping && <span className="animate-pulse ml-0.5 border-r-2 border-current h-4 inline-block" />}
        </span>
    );
}
