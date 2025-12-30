import { useState, useRef, useEffect } from 'react';

interface UseLongPressOptions {
    onLongPress: () => void;
    delay?: number;
}

export function useLongPress({ onLongPress, delay = 500 }: UseLongPressOptions) {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef<NodeJS.Timeout>();
    const target = useRef<EventTarget>();

    const start = (event: React.TouchEvent | React.MouseEvent) => {
        target.current = event.target;
        timeout.current = setTimeout(() => {
            onLongPress();
            setLongPressTriggered(true);
        }, delay);
    };

    const clear = (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
        timeout.current && clearTimeout(timeout.current);
        if (shouldTriggerClick && !longPressTriggered) {
            // Normal click
        }
        setLongPressTriggered(false);
    };

    return {
        onMouseDown: start,
        onTouchStart: start,
        onMouseUp: clear,
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchEnd: clear,
    };
}
