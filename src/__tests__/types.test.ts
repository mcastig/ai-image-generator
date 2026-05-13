import { RESOLUTIONS, COLOR_OPTIONS } from "@/types";

describe("RESOLUTIONS", () => {
  it("has 5 entries", () => {
    expect(RESOLUTIONS).toHaveLength(5);
  });

  it("every entry has label, value, and dalleSize", () => {
    for (const r of RESOLUTIONS) {
      expect(r).toHaveProperty("label");
      expect(r).toHaveProperty("value");
      expect(r).toHaveProperty("dalleSize");
    }
  });

  it("first entry is 1024x1024 square", () => {
    expect(RESOLUTIONS[0].value).toBe("1024x1024");
    expect(RESOLUTIONS[0].dalleSize).toBe("1024x1024");
  });

  it("dalleSize is one of the three allowed DALL-E sizes", () => {
    const allowed = new Set(["1024x1024", "1792x1024", "1024x1792"]);
    for (const r of RESOLUTIONS) {
      expect(allowed.has(r.dalleSize)).toBe(true);
    }
  });

  it("values are unique", () => {
    const values = RESOLUTIONS.map((r) => r.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("COLOR_OPTIONS", () => {
  it("has 6 entries", () => {
    expect(COLOR_OPTIONS).toHaveLength(6);
  });

  it("every entry has label and value", () => {
    for (const c of COLOR_OPTIONS) {
      expect(c).toHaveProperty("label");
      expect(c).toHaveProperty("value");
    }
  });

  it("values are valid hex strings", () => {
    for (const c of COLOR_OPTIONS) {
      expect(c.value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("values are unique", () => {
    const values = COLOR_OPTIONS.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
