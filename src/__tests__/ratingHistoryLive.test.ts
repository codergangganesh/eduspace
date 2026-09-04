import { describe, it, expect } from "vitest";
import {
  fetchCodeforcesRatingHistory,
  fetchAtCoderRatingHistory,
} from "@/services/ratingHistoryService";

describe("live ratingHistoryService tests", () => {
  it("should fetch Codeforces rating history", async () => {
    const cf = await fetchCodeforcesRatingHistory("tourist");
    expect(Array.isArray(cf)).toBe(true);
    expect(cf.length).toBeGreaterThan(0);
    expect(cf[0].platform).toBe("codeforces");
  }, 10000);

  it("should fetch AtCoder algorithmic rating history", async () => {
    const atcoderPoints = await fetchAtCoderRatingHistory("tourist");
    expect(Array.isArray(atcoderPoints)).toBe(true);
    expect(atcoderPoints.length).toBeGreaterThan(0);
    expect(atcoderPoints[0].platform).toBe("atcoder");
    expect(atcoderPoints[0].rating).toBeGreaterThan(0);
  }, 15000);
});
