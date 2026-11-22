import { describe, expect, it } from "vitest";
import { pointsFor, streakAt, streakBonus } from "./scoring";

describe("pointsFor", () => {
  it("gives 1000 for an instant answer", () => expect(pointsFor(0, 20000)).toBe(1000));
  it("gives 750 at half time", () => expect(pointsFor(10000, 20000)).toBe(750));
  it("gives 500 at the buzzer", () => expect(pointsFor(20000, 20000)).toBe(500));
  it("clamps late/negative values", () => {
    expect(pointsFor(25000, 20000)).toBe(500);
    expect(pointsFor(-5, 20000)).toBe(1000);
  });
});

describe("streakBonus", () => {
  it("is 0 for the first correct answer", () => expect(streakBonus(0)).toBe(0));
  it("grows by 100 and caps at 500", () => {
    expect(streakBonus(1)).toBe(100);
    expect(streakBonus(4)).toBe(400);
    expect(streakBonus(9)).toBe(500);
  });
});

describe("streakAt", () => {
  it("counts consecutive correct answers and stops at a miss or gap", () => {
    const m = new Map<number, boolean>([[0, true], [1, true], [2, false], [3, true]]);
    expect(streakAt(m, 1)).toBe(2);
    expect(streakAt(m, 2)).toBe(0);
    expect(streakAt(m, 3)).toBe(1);
    expect(streakAt(m, 5)).toBe(0); // question 5 unanswered
  });
});
