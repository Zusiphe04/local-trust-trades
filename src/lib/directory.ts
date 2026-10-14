import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Handyman",
  "Auto Repair",
  "Beauty",
  "Tutoring",
] as const;

export const PRO_PRICE = 29;

export function trackEvent(listingId: string, type: "view" | "phone_click" | "email_click" | "website_click") {
  void supabase.from("listing_events").insert({ listing_id: listingId, event_type: type });
}

/** Upload to the private media bucket and return a long-lived signed URL. */
export async function uploadMedia(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("listing-media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage
    .from("listing-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("Could not create image link");
  return data.signedUrl;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
