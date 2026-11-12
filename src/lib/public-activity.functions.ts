import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const inquiryInput = z.object({
  listingId: z.string().uuid(),
  customerName: z.string().trim().min(1).max(100),
  customerEmail: z.string().trim().email().max(255),
  customerPhone: z.string().trim().max(40).nullable(),
  message: z.string().trim().min(1).max(2000),
  answers: z.record(z.string(), z.string().max(300)).default({}),
  photoPath: z.string().regex(/^inquiries\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|gif)$/).nullable(),
});

const eventInput = z.object({
  listingId: z.string().uuid(),
  eventType: z.enum(["view", "phone_click", "email_click", "website_click"]),
});

function createPublicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Public activity service is unavailable.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

export const submitPublicInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inquiryInput.parse(input))
  .handler(async ({ data }) => {
    const client = createPublicClient();
    const { data: listing, error: listingError } = await client.from("listings").select("id").eq("id", data.listingId).eq("moderation_status", "active").maybeSingle();
    if (listingError || !listing) throw new Error("This listing is not available for quote requests.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("inquiries").insert({
      listing_id: data.listingId,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone || null,
      message: data.message,
      answers: data.answers,
      photo_path: data.photoPath,
    });
    if (error) throw new Error("Could not send the request. Please try again.");
    return { ok: true };
  });

export const recordPublicListingEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => eventInput.parse(input))
  .handler(async ({ data }) => {
    const client = createPublicClient();
    const { data: listing, error: listingError } = await client.from("listings").select("id").eq("id", data.listingId).eq("moderation_status", "active").maybeSingle();
    if (listingError || !listing) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("listing_events").insert({ listing_id: data.listingId, event_type: data.eventType });
    return { ok: !error };
  });

export const uploadPublicInquiryPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Invalid photo upload.");
    const listingId = z.string().uuid().parse(input.get("listingId"));
    const photo = input.get("photo");
    if (!(photo instanceof File)) throw new Error("Choose a photo to upload.");
    const extension = photo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!/[.]/.test(photo.name) || !["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(extension) || photo.size > 8 * 1024 * 1024 || !photo.type.startsWith("image/")) {
      throw new Error("Use a JPG, PNG, WebP, HEIC or GIF photo under 8 MB.");
    }
    return { listingId, photo };
  })
  .handler(async ({ data }) => {
    const client = createPublicClient();
    const { data: listing, error: listingError } = await client.from("listings").select("id").eq("id", data.listingId).eq("moderation_status", "active").maybeSingle();
    if (listingError || !listing) throw new Error("This listing is not available for quote requests.");
    const extension = data.photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `inquiries/${crypto.randomUUID()}.${extension}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("listing-media").upload(path, data.photo, { contentType: data.photo.type, upsert: false });
    if (error) throw new Error("Photo upload failed. Try again or skip the photo.");
    return { path };
  });