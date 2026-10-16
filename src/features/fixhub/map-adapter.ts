import type { Booking, Persona, Status } from "./demo-model";

export type Pin = { lat: number; lng: number; accuracy?: number };
export interface LocationAdapter {
  mode: "demo" | "live";
  currentLocation(): Promise<Pin>;
  search(query: string, cityId: string): Promise<never[]>;
}
const activeAssignmentStatuses: ReadonlySet<Status> = new Set([
  "accepted",
  "scheduled",
  "travel",
  "arrived",
  "inspection",
  "awaiting_quote",
  "approved",
  "in_progress",
]);

export function canOpenAssignedDirections(
  booking: Pick<Booking, "location" | "merchantId" | "technicianId" | "status">,
  actor: Pick<Persona, "id" | "role" | "merchantId"> | null,
): boolean {
  if (!actor || !booking.location || !booking.merchantId || !activeAssignmentStatuses.has(booking.status)) {
    return false;
  }
  if (actor.role === "merchant") return actor.merchantId === booking.merchantId;
  if (actor.role === "technician") return actor.id === booking.technicianId;
  return false;
}

function validatedCoordinates(destination: Pick<Pin, "lat" | "lng">): string {
  if (
    !Number.isFinite(destination.lat) ||
    !Number.isFinite(destination.lng) ||
    destination.lat < -90 ||
    destination.lat > 90 ||
    destination.lng < -180 ||
    destination.lng > 180
  ) {
    throw new RangeError("Map links require valid destination coordinates");
  }
  return `${destination.lat},${destination.lng}`;
}

export function googleMapsPinUrl(destination: Pick<Pin, "lat" | "lng">): string {
  const query = new URLSearchParams({ api: "1", query: validatedCoordinates(destination) });
  return `https://www.google.com/maps/search/?${query.toString()}`;
}

export function googleMapsDirectionsUrl(destination: Pick<Pin, "lat" | "lng">): string {
  const query = new URLSearchParams({
    api: "1",
    destination: validatedCoordinates(destination),
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${query.toString()}`;
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
