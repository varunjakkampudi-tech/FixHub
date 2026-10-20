import ac from "@/assets/svc-ac.jpg";
import electrician from "@/assets/svc-electrician.jpg";
import plumbing from "@/assets/svc-plumbing.jpg";
import appliance from "@/assets/svc-appliance.jpg";

/** Generated SAMPLE photos — never real FixHub24 professionals. */
const photos: Record<string, string> = {
  ac,
  electrician,
  plumbing,
  appliance,
  appliances: appliance,
};
export const servicePhoto = (id: string): string | undefined => photos[id];
