export function AIQuizGenerationLoader() {
  const label = "Generating";

  return (
    <div
      className="ai-quiz-loader-wrapper"
      role="status"
      aria-live="polite"
      aria-label="Generating AI quiz"
    >
      <div className="ai-quiz-loader" aria-hidden="true" />
      <div className="flex gap-[0.03em] uppercase tracking-[0.22em] text-[0.8rem] sm:text-[0.9rem]">
        {label.split("").map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className="ai-quiz-loader-letter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
