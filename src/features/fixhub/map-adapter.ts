export type Pin = { lat: number; lng: number; accuracy?: number };
export interface LocationAdapter {
  mode: "demo" | "live";
  currentLocation(): Promise<Pin>;
  search(query: string, cityId: string): Promise<never[]>;
}
// No geographic network requests in the unapproved demo. Browser GPS is deliberate and local.
export class MockMapAdapter implements LocationAdapter {
  mode = "demo" as const;
  currentLocation() {
    return new Promise<Pin>((resolve, reject) => {
      if (!window.isSecureContext || !navigator.geolocation) {
        reject(new Error("unavailable"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) =>
          resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        (e) => reject(new Error(e.code === 1 ? "denied" : "timeout")),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }
  async search(_query: string, _cityId: string): Promise<never[]> {
    return [];
  }
}
// Deliberately not a live implementation. Enable only after separate owner approval,
// restricted browser rendering credentials, authenticated bounded Places/Geocoding and Cloud authorization.
export const liveMapsSetup = {
  enabled: false,
  provider: "Google Maps Platform",
  billingApproved: false,
} as const;
