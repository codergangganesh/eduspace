import { QuizQuestion, QuizOption } from '@/types/quiz';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = 'deepseek/deepseek-r1-0528:free';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export type Difficulty = 'easy' | 'medium' | 'hard';

interface GenerateFromTopicParams {
    topic: string;
    difficulty: Difficulty;
    count: number;
}

interface GenerateFromFileParams {
    fileText: string;
    count: number;
}

const buildTopicPrompt = (topic: string, difficulty: Difficulty, count: number): string => `
You are an expert academic quiz generator. Generate exactly ${count} multiple-choice questions about the topic: "${topic}".

Difficulty level: ${difficulty.toUpperCase()}
- EASY: Basic recall and understanding questions
- MEDIUM: Application and analysis questions
- HARD: Evaluation, synthesis, and critical thinking questions

Rules:
1. Each question must have exactly 4 options labeled A, B, C, D
2. Exactly one option must be correct
3. Distractor options must be plausible but clearly incorrect
4. Questions must be academic, clear, and unambiguous
5. No trick questions or vague wording
6. Questions should be syllabus-aligned and suitable for students

Respond ONLY with a valid JSON array (no markdown fences, no extra text). Each element must follow this exact structure:
[
  {
    "question_text": "What is ...?",
    "options": [
      {"label": "A", "text": "Option text 1"},
      {"label": "B", "text": "Option text 2"},
      {"label": "C", "text": "Option text 3"},
      {"label": "D", "text": "Option text 4"}
    ],
    "correct_label": "A"
  }
]
`;

const buildFilePrompt = (text: string, count: number): string => `
You are an expert academic quiz generator. Based STRICTLY on the following document content, generate exactly ${count} multiple-choice questions.

DOCUMENT CONTENT:
---
${text.slice(0, 15000)}
---

Rules:
1. Questions must be based ONLY on the provided content — do not add external knowledge
2. Each question must have exactly 4 options labeled A, B, C, D
3. Exactly one option must be correct
4. Distractor options must be plausible but clearly incorrect
5. Questions must be academic, clear, and unambiguous
6. Cover different sections/concepts from the document

Respond ONLY with a valid JSON array (no markdown fences, no extra text). Each element must follow this exact structure:
[
  {
    "question_text": "What is ...?",
    "options": [
      {"label": "A", "text": "Option text 1"},
      {"label": "B", "text": "Option text 2"},
      {"label": "C", "text": "Option text 3"},
      {"label": "D", "text": "Option text 4"}
    ],
    "correct_label": "A"
  }
]
`;

interface RawAIQuestion {
    question_text: string;
    options: { label: string; text: string }[];
    correct_label: string;
}

function transformToQuizQuestions(raw: RawAIQuestion[]): QuizQuestion[] {
    return raw.map((q, index) => {
        const options: QuizOption[] = q.options.map(opt => ({
            id: generateId(),
            text: opt.text
        }));

        const correctIndex = q.options.findIndex(opt => opt.label === q.correct_label);
        const correctAnswer = correctIndex >= 0 ? options[correctIndex].id : options[0].id;

        return {
            id: generateId(),
            quiz_id: '',
            question_text: q.question_text,
            question_type: 'multiple_choice' as const,
            marks: 1,
            options,
            correct_answer: correctAnswer,
            order_index: index
        };
    });
}

async function callAI(prompt: string): Promise<QuizQuestion[]> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.');
    }

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'EduSpace Quiz Generator',
        },
        body: JSON.stringify({
            model: AI_MODEL,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 8192,
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        console.error('OpenRouter API error:', errBody);
        throw new Error('Failed to generate questions. Please check your API key and try again.');
    }

    const data = await response.json();

    const textContent = data?.choices?.[0]?.message?.content;
    if (!textContent) {
        throw new Error('AI returned an empty response. Please try again.');
    }

    // DeepSeek R1 uses <think>...</think> for chain-of-thought reasoning — strip it
    let cleaned = textContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Strip markdown code fences if present
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let parsed: RawAIQuestion[];
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        console.error('Failed to parse AI response:', cleaned);
        throw new Error('AI returned an invalid response format. Please try again.');
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AI did not generate any questions. Please try again with a different topic.');
    }

    return transformToQuizQuestions(parsed);
}

export async function generateFromTopic({ topic, difficulty, count }: GenerateFromTopicParams): Promise<QuizQuestion[]> {
    const clampedCount = Math.min(Math.max(count, 1), 15);
    const prompt = buildTopicPrompt(topic, difficulty, clampedCount);
    return callAI(prompt);
}

export async function generateFromFile({ fileText, count }: GenerateFromFileParams): Promise<QuizQuestion[]> {
    if (!fileText.trim()) {
        throw new Error('Could not extract any text from the uploaded file.');
    }
    const clampedCount = Math.min(Math.max(count, 1), 15);
    const prompt = buildFilePrompt(fileText, clampedCount);
    return callAI(prompt);
}


export async function extractTextFromPDF(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source to unpkg which is often more reliable for this
    // Use the exact version from the imported library
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item: any) => item.str)
            .join(' ');
        textParts.push(pageText);
    }

    return textParts.join('\n\n');
}
