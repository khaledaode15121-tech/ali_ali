import { describe, expect, it } from "vitest";

import { normalizeImageUrl } from "../../server/image-utils.js";

describe("image handling", () => {
  it("keeps valid image urls and falls back when empty", () => {
    expect(normalizeImageUrl("https://example.com/image.jpg")).toBe("https://example.com/image.jpg");
    expect(normalizeImageUrl("", "https://example.com/fallback.jpg")).toBe("https://example.com/fallback.jpg");
    expect(normalizeImageUrl("   ", "https://example.com/fallback.jpg")).toBe("https://example.com/fallback.jpg");
  });
});
