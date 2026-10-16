import { describe, expect, it } from "vitest";
import { googleMapsDirectionsUrl } from "@/features/fixhub/real-merchant";

describe("merchant directions", () => {
  it("opens an explicit Google Maps route using assigned job coordinates", () => {
    expect(googleMapsDirectionsUrl(16.75, 81.68)).toBe("https://www.google.com/maps/dir/?api=1&destination=16.75%2C81.68");
  });

  it("rejects invalid coordinates before constructing an external URL", () => {
    expect(() => googleMapsDirectionsUrl(91, 81.68)).toThrow("Coordinates are outside the valid range.");
    expect(() => googleMapsDirectionsUrl(16.75, Number.NaN)).toThrow("Coordinates are outside the valid range.");
  });
});
