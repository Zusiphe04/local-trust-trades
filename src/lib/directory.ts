import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { recordPublicListingEvent } from "@/lib/public-activity.functions";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export { CATEGORIES, PRO_PRICE, PRO_ANNUAL_PRICE } from "./localization";

export function trackEvent(listingId: string, type: "view" | "phone_click" | "email_click" | "website_click") {
  void recordPublicListingEvent({ data: { listingId, eventType: type } });
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
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Providers (role or owning a listing) go to /dashboard; customers go to /search. */
export async function getUserRole(userId: string): Promise<"provider" | "customer"> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data?.role === "provider" ? "provider" : "customer";
}
