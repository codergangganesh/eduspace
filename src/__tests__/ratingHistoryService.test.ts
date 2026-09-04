import { describe, it, expect } from "vitest";
import { mergeRatingHistories, RatingPoint } from "@/services/ratingHistoryService";

describe("ratingHistoryService", () => {
  it("should merge and sort rating points chronologically across the Big 4 contest platforms", () => {
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

    const atcoderPoints: RatingPoint[] = [
      {
        platform: "atcoder",
        contestName: "ABC 335",
        rating: 1100,
        date: "2024-01-08",
        timestamp: 1704672000,
      },
    ];

    const merged = mergeRatingHistories(
      cfPoints,
      lcPoints,
      ccPoints,
      atcoderPoints
    );

    expect(merged.length).toBe(4);
    expect(merged[0].date).toBe("2024-01-05");
    expect(merged[0].codechef).toBe(1400);

    expect(merged[1].date).toBe("2024-01-08");
    expect(merged[1].atcoder).toBe(1100);

    expect(merged[2].date).toBe("2024-01-10");
    expect(merged[2].codeforces).toBe(1500);

    expect(merged[3].date).toBe("2024-01-15");
    expect(merged[3].leetcode).toBe(1650);
  });

  it("should return an empty array if all platform histories are empty", () => {
    const merged = mergeRatingHistories([], [], [], []);
    expect(merged).toEqual([]);
  });
});
