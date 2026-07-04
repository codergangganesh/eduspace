export type WordDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

const WORDS_BY_DIFFICULTY: Record<WordDifficulty, string[]> = {
  easy: [
    "sun", "moon", "star", "sky", "path", "game", "word", "type", "fast", "play",
    "glow", "neon", "grid", "ship", "wave", "blue", "life", "dust", "beam", "laser",
    "atom", "core", "data", "code", "tech", "zone", "loop", "quiz", "mind", "idea"
  ],
  medium: [
    "rocket", "galaxy", "nebula", "space", "cosmic", "planet", "gravity", "launch",
    "flight", "orbit", "meteor", "comet", "shield", "weapon", "energy", "spark",
    "blast", "active", "speed", "screen", "typing", "student", "future", "arcade",
    "system", "matrix", "portal", "vector", "binary", "sensor"
  ],
  hard: [
    "asteroid", "astronaut", "satellite", "spaceship", "starlight", "universe",
    "supernova", "velocity", "telescope", "discovery", "explorer", "blackhole",
    "education", "playground", "challenge", "synthesizer", "dimension", "processor",
    "javascript", "typescript", "algorithm", "database"
  ],
  extreme: [
    "constellations", "astrophysics", "interstellar", "gravitational",
    "extraterrestrial", "thermodynamics", "mathematical", "synchronization",
    "electromagnetic", "quantumphysics", "superposition", "nanotechnology"
  ]
};

export function getRandomWord(difficulty: WordDifficulty): string {
  const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY.easy;
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

export function getDifficultyInfo(difficulty: WordDifficulty) {
  switch (difficulty) {
    case 'easy':
      return { label: "Easy Speed", description: "3-5 letter words. Perfect for warm-up." };
    case 'medium':
      return { label: "Medium Speed", description: "5-7 letter words. Standard typing practice." };
    case 'hard':
      return { label: "Hard Speed", description: "8-10 letter words. Challenging and complex." };
    case 'extreme':
      return { label: "Extreme Speed", description: "10+ letter words. High-speed typing wizards." };
  }
}
