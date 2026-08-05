import { describe, it, expect } from "vitest";
import { mergeRatingHistories, RatingPoint } from "@/services/ratingHistoryService";

describe("ratingHistoryService", () => {
  it("should merge and sort rating points chronologically across 5 platforms", () => {
    const cfPoints: RatingPoint[] = [
      {
        platform: "codeforces",
        contestName: "Codeforces Round 800",
        rating: 1500,
        date: "2024-01-10",
        timestamp: 1704844800,
      },
    ];

    const lcPoints: RatingPoint[] = [
      {
        platform: "leetcode",
        contestName: "Weekly Contest 380",
        rating: 1650,
        date: "2024-01-15",
        timestamp: 1705276800,
      },
    ];

    const ccPoints: RatingPoint[] = [
      {
        platform: "codechef",
        contestName: "Starters 115",
        rating: 1400,
        date: "2024-01-05",
        timestamp: 1704412800,
      },
    ];

    const cwPoints: RatingPoint[] = [
      {
        platform: "codewars",
        contestName: "Kata Challenge",
        rating: 1200,
        date: "2024-01-18",
        timestamp: 1705536000,
      },
    ];

    const hrPoints: RatingPoint[] = [
      {
        platform: "hackerrank",
        contestName: "HackerRank Contest",
        rating: 1350,
        date: "2024-01-12",
        timestamp: 1705017600,
      },
    ];

    const merged = mergeRatingHistories(cfPoints, lcPoints, ccPoints, cwPoints, hrPoints);

    expect(merged.length).toBe(5);
    expect(merged[0].date).toBe("2024-01-05");
    expect(merged[0].codechef).toBe(1400);

    expect(merged[1].date).toBe("2024-01-10");
    expect(merged[1].codeforces).toBe(1500);

    expect(merged[2].date).toBe("2024-01-12");
    expect(merged[2].hackerrank).toBe(1350);

    expect(merged[3].date).toBe("2024-01-15");
    expect(merged[3].leetcode).toBe(1650);

    expect(merged[4].date).toBe("2024-01-18");
    expect(merged[4].codewars).toBe(1200);
  });

  it("should return an empty array if all platform histories are empty", () => {
    const merged = mergeRatingHistories([], [], [], [], []);
    expect(merged).toEqual([]);
  });
});
