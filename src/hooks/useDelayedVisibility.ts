import { useEffect, useRef, useState } from "react";

interface DelayedVisibilityOptions {
  delayMs?: number;
  minVisibleMs?: number;
}

export function useDelayedVisibility(
  active: boolean,
  { delayMs = 120, minVisibleMs = 220 }: DelayedVisibilityOptions = {},
) {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    if (active) {
      if (!visible) {
        timer = window.setTimeout(() => {
          shownAtRef.current = Date.now();
          setVisible(true);
        }, delayMs);
      }

      return () => {
        if (timer) {
          window.clearTimeout(timer);
        }
      };
    }

    if (!visible) {
      shownAtRef.current = null;
      return;
    }

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 0;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    timer = window.setTimeout(() => {
      shownAtRef.current = null;
      setVisible(false);
    }, remaining);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [active, delayMs, minVisibleMs, visible]);

  return visible;
}
