import { describe, expect, it } from "vitest";
import { googleMapsAddressDirectionsUrl, googleMapsDirectionsUrl } from "@/features/fixhub/real-merchant";

describe("merchant directions", () => {
  it("opens an explicit Google Maps route using assigned job coordinates", () => {
    expect(googleMapsDirectionsUrl(16.75, 81.68)).toBe("https://www.google.com/maps/dir/?api=1&destination=16.75%2C81.68");
  });

  it("rejects invalid coordinates before constructing an external URL", () => {
    expect(() => googleMapsDirectionsUrl(91, 81.68)).toThrow("Coordinates are outside the valid range.");
    expect(() => googleMapsDirectionsUrl(16.75, Number.NaN)).toThrow("Coordinates are outside the valid range.");
  });

  it("offers an encoded address fallback when job coordinates are unavailable", () => {
    const url = new URL(googleMapsAddressDirectionsUrl(" 12 Main St & 2nd Ave ", " Tanuku "));
    expect(url.searchParams.get("destination")).toBe("12 Main St & 2nd Ave, Tanuku");
  });

  it("rejects an empty address rather than opening a blank map search", () => {
    expect(() => googleMapsAddressDirectionsUrl("  ", " ")).toThrow("A service address is required for directions.");
  });
});
