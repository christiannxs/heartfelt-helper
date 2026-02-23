import { describe, it, expect } from "vitest";
import { cn, timeShort } from "@/lib/utils";

describe("cn", () => {
  it("merge classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("merge with tailwind conflict", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("timeShort", () => {
  it("formats HH:mm:ss to HH:mm", () => {
    expect(timeShort("08:30:00")).toBe("08:30");
  });

  it("returns empty string for empty input", () => {
    expect(timeShort("")).toBe("");
  });

  it("handles short string", () => {
    expect(timeShort("12:00")).toBe("12:00");
  });
});
