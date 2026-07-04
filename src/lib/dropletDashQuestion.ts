export type DropletDifficulty = "easy" | "medium" | "hard" | "extreme";

export interface MathQuestion {
  expression: string;
  correctAnswer: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(expression: string, correctAnswer: number): MathQuestion {
  return { expression, correctAnswer };
}

function easyQuestion(): MathQuestion {
  const a = randomInt(1, 20);
  const b = randomInt(1, 20);

  if (Math.random() < 0.55) {
    return makeQuestion(`${a} + ${b}`, a + b);
  }

  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return makeQuestion(`${big} - ${small}`, big - small);
}

function mediumQuestion(): MathQuestion {
  if (Math.random() < 0.6) {
    const a = randomInt(2, 12);
    const b = randomInt(2, 12);
    return makeQuestion(`${a} x ${b}`, a * b);
  }

  const divisor = randomInt(2, 12);
  const answer = randomInt(2, 12);
  return makeQuestion(`${divisor * answer} / ${divisor}`, answer);
}

function hardQuestion(): MathQuestion {
  const mode = randomInt(0, 3);

  if (mode === 0) {
    const a = randomInt(10, 40);
    const b = randomInt(5, 25);
    return makeQuestion(`${a} + ${b}`, a + b);
  }

  if (mode === 1) {
    const a = randomInt(20, 60);
    const b = randomInt(5, Math.min(35, a));
    return makeQuestion(`${a} - ${b}`, a - b);
  }

  if (mode === 2) {
    const a = randomInt(3, 15);
    const b = randomInt(3, 15);
    return makeQuestion(`${a} x ${b}`, a * b);
  }

  const divisor = randomInt(3, 12);
  const answer = randomInt(3, 15);
  return makeQuestion(`${divisor * answer} / ${divisor}`, answer);
}

function extremeQuestion(): MathQuestion {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const c = randomInt(2, 8);

  if (Math.random() < 0.5) {
    return makeQuestion(`(${a} + ${b}) x ${c}`, (a + b) * c);
  }

  return makeQuestion(`${a} + ${b} x ${c}`, a + b * c);
}

export function generateQuestion(difficulty: DropletDifficulty): MathQuestion {
  if (difficulty === "easy") return easyQuestion();
  if (difficulty === "medium") return mediumQuestion();
  if (difficulty === "hard") return hardQuestion();
  return extremeQuestion();
}

export function getDifficultyInfo(difficulty: DropletDifficulty): {
  label: string;
  description: string;
  operations: string;
  color: string;
} {
  if (difficulty === "easy") {
    return {
      label: "Easy",
      description: "Simple addition and subtraction",
      operations: "Addition and subtraction",
      color: "emerald",
    };
  }

  if (difficulty === "medium") {
    return {
      label: "Medium",
      description: "Times tables and clean division",
      operations: "Multiplication and division",
      color: "amber",
    };
  }

  if (difficulty === "hard") {
    return {
      label: "Hard",
      description: "Mixed operations with larger numbers",
      operations: "All operations",
      color: "orange",
    };
  }

  return {
    label: "Extreme",
    description: "Short order-of-operations challenges",
    operations: "BODMAS",
    color: "rose",
  };
}
