export type QuizStatus = 'draft' | 'published' | 'closed';

export interface QuizOption {
    id: string;
    text: string;
}

export interface QuizQuestion {
    id: string;
    quiz_id: string;
    question_text: string;
    question_type: 'multiple_choice'; // Expandable for future types
    marks: number;
    options: QuizOption[];
    correct_answer: string; // Option ID
    order_index: number;
}

export interface Quiz {
    id: string;
    class_id: string;
    title: string;
    description: string | null;
    total_marks: number;
    pass_percentage: number;
    status: QuizStatus;
    created_at: string;
    created_by?: string;
    // Joins
    _count?: {
        questions: number;
        submissions: number;
    };
}

export interface QuizSubmission {
    id: string;
    quiz_id: string;
    student_id: string;
    total_obtained: number;
    status: 'passed' | 'failed' | 'pending';
    submitted_at: string;
    student?: {
        full_name: string;
        avatar_url: string;
    };
}

export interface QuizAnswer {
    id: string;
    submission_id: string;
    question_id: string;
    selected_option: string;
    is_correct: boolean;
}
