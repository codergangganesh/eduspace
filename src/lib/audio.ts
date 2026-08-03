type AudioContextConstructor = typeof AudioContext;

type WindowWithAudioContext = Window & typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor;
};

let audioContext: AudioContext | null = null;
let pendingAudioContextPromise: Promise<AudioContext | null> | null = null;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const windowWithAudio = window as WindowWithAudioContext;
  return windowWithAudio.AudioContext || windowWithAudio.webkitAudioContext || null;
}

export async function getUserGestureAudioContext(): Promise<AudioContext | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (audioContext) {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    return audioContext;
  }

  if (pendingAudioContextPromise) {
    return pendingAudioContextPromise;
  }

  const AudioContextCtor = getAudioContextConstructor();
  if (!AudioContextCtor) {
    return null;
  }

  pendingAudioContextPromise = new Promise<AudioContext | null>((resolve) => {
    const cleanup = () => {
      document.removeEventListener('pointerdown', onGesture, { capture: true });
      document.removeEventListener('touchstart', onGesture, { capture: true });
      document.removeEventListener('keydown', onGesture, { capture: true });
      document.removeEventListener('mousedown', onGesture, { capture: true });
    };

    const onGesture = () => {
      try {
        const ctx = new AudioContextCtor();
        audioContext = ctx;
        if (ctx.state === 'suspended') {
          Promise.resolve(ctx.resume())
            .then(() => resolve(ctx))
            .catch(() => resolve(null))
            .finally(cleanup);
          return;
        }

        resolve(ctx);
        cleanup();
      } catch (error) {
        console.warn('AudioContext could not be created after user gesture:', error);
        resolve(null);
        cleanup();
      }
    };

    document.addEventListener('pointerdown', onGesture, { capture: true, once: true });
    document.addEventListener('touchstart', onGesture, { capture: true, once: true });
    document.addEventListener('keydown', onGesture, { capture: true, once: true });
    document.addEventListener('mousedown', onGesture, { capture: true, once: true });

    if (document.visibilityState === 'hidden') {
      resolve(null);
      cleanup();
      return;
    }
  });

  return pendingAudioContextPromise;
}
