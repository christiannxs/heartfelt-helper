import { describe, it, expect } from "vitest";
import { getErrorMessage } from "@/lib/errors";

describe("getErrorMessage", () => {
  it("returns message from Error", () => {
    expect(getErrorMessage(new Error("foo"))).toBe("foo");
  });

  it("returns message from object with message", () => {
    expect(getErrorMessage({ message: "bar" })).toBe("bar");
  });

  it("returns default for unknown", () => {
    expect(getErrorMessage(123)).toBe("Erro desconhecido");
    expect(getErrorMessage(null)).toBe("Erro desconhecido");
  });
});
