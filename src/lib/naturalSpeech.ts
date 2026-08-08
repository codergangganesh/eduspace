/**
 * Natural Voice TTS Engine
 * Provides hyper-realistic, human-like voice synthesis for Eduspace AI responses.
 * Avoids robotic legacy voices (David, Zira, Mark, eSpeak).
 */

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Returns the best available natural/neural human voice.
 */
export const getNaturalVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const enVoices = voices.filter((v) => v.lang.startsWith("en"));
  if (enVoices.length === 0) return voices[0] || null;

  // 1. Natural / Neural online voices (Microsoft Natural, Ava, Andrew, Jenny, Aria, Guy)
  const naturalNeural = enVoices.find((v) =>
    /Natural|Neural|Ava|Andrew|Jenny|Aria|Guy|Emma|Steffan/i.test(v.name)
  );
  if (naturalNeural) return naturalNeural;

  // 2. High Quality Google & Apple Enhanced voices
  const googleOrApple = enVoices.find((v) =>
    /Google US English|Google UK English Female|Samantha \(Enhanced\)|Karen \(Enhanced\)|Enhanced|Premium/i.test(v.name)
  );
  if (googleOrApple) return googleOrApple;

  // 3. Online remote voices (non-local)
  const remoteVoice = enVoices.find((v) => !v.localService);
  if (remoteVoice) return remoteVoice;

  // 4. Any English voice that is NOT a robotic legacy default
  const nonRobotic = enVoices.find((v) =>
    !/David|Mark|Zira|eSpeak|Desktop|Synthesizer/i.test(v.name)
  );
  if (nonRobotic) return nonRobotic;

  return enVoices[0];
};

/**
 * Speaks text using realistic natural audio or high-definition neural voice synthesis.
 */
export const speakNaturalText = (
  text: string,
  onEnd: () => void,
  onError: () => void
): { stop: () => void } => {
  if (typeof window === "undefined") {
    onError();
    return { stop: () => {} };
  }

  // Stop any ongoing browser speech
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  // Clean formatting for fluid human speech cadence
  const cleanText = text
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~#]/g, "")
    .replace(/\n+/g, ". ")
    .trim();

  if (!cleanText) {
    onEnd();
    return { stop: () => {} };
  }

  // If text is short/medium (< 180 chars) and online, try Google Translate Natural Voice MP3 stream
  if (cleanText.length <= 180 && typeof Audio !== "undefined" && navigator.onLine) {
    try {
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = 1.0;

      let stopped = false;

      audio.onended = () => {
        if (!stopped) onEnd();
      };
      audio.onerror = () => {
        // Fallback to browser neural TTS if audio load fails
        if (!stopped) fallbackWebSpeech();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (!stopped) fallbackWebSpeech();
        });
      }

      return {
        stop: () => {
          stopped = true;
          audio.pause();
          audio.currentTime = 0;
        },
      };
    } catch {
      // Fallthrough to Web Speech
    }
  }

  // Web Speech Fallback using selected Natural Neural Voice
  return fallbackWebSpeech();

  function fallbackWebSpeech() {
    if (!("speechSynthesis" in window)) {
      onError();
      return { stop: () => {} };
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Human speaking rate
    utterance.pitch = 1.0;

    const naturalVoice = getNaturalVoice();
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      onEnd();
    };

    utterance.onerror = (err) => {
      console.warn("TTS Error:", err);
      onError();
    };

    window.speechSynthesis.speak(utterance);

    return {
      stop: () => {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      },
    };
  }
};
