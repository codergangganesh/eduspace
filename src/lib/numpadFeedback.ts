/**
 * EduSpace Numpad Audio & Haptic Feedback Engine
 * Synthesizes tactile mechanical keyboard sound effects via Web Audio API
 * and triggers native mobile haptic vibrations with zero external audio assets.
 */

let audioCtx: AudioContext | null = null;
let isAudioMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export const numpadFeedback = {
  /**
   * Play subtle mechanical keypress audio + haptic vibration
   */
  playKeypress(digit?: number | string): void {
    // 1. Mobile Haptic Vibration
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(12);
      } catch {}
    }

    // 2. Synthesized Mechanical Click
    if (isAudioMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Pitch variation slightly per digit (1750Hz - 2200Hz)
      const baseFreq = typeof digit === "number" ? 1750 + digit * 45 : 1850;

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3200, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.038);
    } catch {}
  },

  /**
   * Play backspace / delete mechanical pop
   */
  playDelete(): void {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }

    if (isAudioMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.042);
    } catch {}
  },

  /**
   * Play uplifting unlock chime (Two-tone C5 -> G5)
   */
  playSuccess(): void {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate([20, 35, 25]);
      } catch {}
    }

    if (isAudioMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playTone(523.25, now, 0.18); // C5
      playTone(783.99, now + 0.08, 0.25); // G5
    } catch {}
  },

  /**
   * Play subtle error rejection thud
   */
  playError(): void {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {}
    }

    if (isAudioMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.14);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  },

  /**
   * Toggle or set mute state
   */
  setMuted(muted: boolean): void {
    isAudioMuted = muted;
  },

  isMuted(): boolean {
    return isAudioMuted;
  }
};
