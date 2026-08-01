import { describe, it, expect } from "vitest";
import { CONTENT } from "./index";
import { validateContent } from "./schema";

describe("CONTENT bundle", () => {
  it("passes its own validator", () => {
    expect(validateContent(CONTENT)).toEqual([]);
  });
  it("includes the required recruiting event and QB events", () => {
    const ids = CONTENT.events.map((e) => e.id);
    expect(ids).toContain("recruiting");
    expect(ids).toContain("gym-grind");
  });
  it("defines stats for all six position buckets", () => {
    expect(Object.keys(CONTENT.positions).sort()).toEqual(["DL", "DSKILL", "K", "OL", "OSKILL", "QB"]);
  });
});
