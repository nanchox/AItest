import { describe, expect, it } from "vitest";
import { DICTS, makeT, ordinal } from "./i18n";

describe("i18n", () => {
  it("interpolates variables", () => expect(makeT("en")("p.inLobby", { name: "Ana" })).toBe("You're in, Ana!"));
  it("handles plurals", () => {
    expect(makeT("en")("h.playersCount", { n: 1 })).toBe("1 player");
    expect(makeT("es")("h.playersCount", { n: 3 })).toBe("3 jugadores");
  });
  it("falls back to English, then to the key", () => expect(makeT("es")("nope.key")).toBe("nope.key"));
  it("formats ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map((n) => ordinal("en", n))).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
    expect(ordinal("es", 3)).toBe("3.º");
  });
  it("has the same keys in English and Spanish", () => {
    expect(Object.keys(DICTS.es).sort()).toEqual(Object.keys(DICTS.en).sort());
  });
});
