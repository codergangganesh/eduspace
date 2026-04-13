import Vapi from "@vapi-ai/web";

const token = import.meta.env.VITE_VAPI_PUBLIC_KEY;

export const isVapiConfigured = () => {
  return !!token && token.length > 0 && token !== "undefined";
};

let vapiInstance: Vapi | null = null;

export const getVapi = () => {
  if (!isVapiConfigured()) {
    throw new Error("VAPI is not configured. Please set VITE_VAPI_PUBLIC_KEY.");
  }
  
  if (!vapiInstance) {
    vapiInstance = new Vapi(token!);
    console.log("[VAPI] Initialized with token");
  }
  
  return vapiInstance;
};

export const interviewerConfig = {
  name: "Interviewer",
  firstMessage:
    "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

Interview Guidelines:
Follow the structured question flow:
{{questions}}

Engage naturally & react appropriately:
Listen actively to responses and acknowledge them before moving forward.
Ask brief follow-up questions if a response is vague or requires more detail.
Keep the conversation flowing smoothly while maintaining control.
Be professional, yet warm and welcoming:

Use official yet friendly language.
Keep responses concise and to the point (like in a real voice interview).
Avoid robotic phrasing—sound natural and conversational.
Answer the candidate’s questions professionally:

If asked about the role, company, or expectations, provide a clear and relevant answer.
If unsure, redirect the candidate to HR for more details.

Conclude the interview properly:
Thank the candidate for their time.
Inform them that the company will reach out soon with feedback.
End the conversation on a polite and positive note.


- Be sure to be professional and polite.
- Keep all your responses short and simple. Use official language, but be kind and welcoming.
- This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.`,
      },
    ],
  },
};

// Export singleton instance
export const vapi = isVapiConfigured()
  ? getVapi()
  : ({
      start: () => Promise.reject(new Error("VAPI is not configured. Please set VITE_VAPI_PUBLIC_KEY.")),
      stop: () => Promise.resolve(),
      on: () => {},
      off: () => {},
      say: () => {},
    } as any);
