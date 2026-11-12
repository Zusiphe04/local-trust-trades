import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function requireAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (error || data?.role !== "admin") throw new Error("Administrator access required.");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [roles, listings, inquiries, events, reviews] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role, registration_complete"),
      supabaseAdmin.from("listings").select("id, user_id, business_name, category, plan_type, is_featured, is_verified, verification_status, verification_identity_path, verification_business_path, moderation_status, is_flagged, subscription_status, next_billing_date, payment_method_label, accepts_eft, accepts_snapscan, accepts_card, accepts_cash, payfast_link, service_area, created_at"),
      supabaseAdmin.from("inquiries").select("id, created_at"),
      supabaseAdmin.from("listing_events").select("event_type, created_at"),
      supabaseAdmin.from("reviews").select("id, created_at"),
    ]);
    const failed = [roles.error, listings.error, inquiries.error, events.error, reviews.error].find(Boolean);
    if (failed) throw new Error("Could not load administrator overview.");
    return {
      roles: roles.data ?? [],
      listings: listings.data ?? [],
      inquiries: inquiries.data ?? [],
      events: events.data ?? [],
      reviews: reviews.data ?? [],
    };
  });

export const updateAdminListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    listingId: z.string().uuid(),
    action: z.enum(["approve", "reject", "upgrade", "downgrade", "verified", "flagged", "moderation"]),
    value: z.union([z.string(), z.boolean()]).optional(),
  }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let update: Database["public"]["Tables"]["listings"]["Update"];
    switch (data.action) {
      case "approve": update = { verification_status: "approved", is_verified: true }; break;
      case "reject": update = { verification_status: "rejected", is_verified: false }; break;
      case "upgrade": update = { plan_type: "pro", is_featured: true, subscription_status: "active" }; break;
      case "downgrade": update = { plan_type: "free", is_featured: false, subscription_status: "cancelled", next_billing_date: null, payment_method_label: null }; break;
      case "verified": update = { is_verified: data.value === true, verification_status: data.value === true ? "approved" : "rejected" }; break;
      case "flagged": update = { is_flagged: data.value === true }; break;
      case "moderation":
        if (data.value !== "active" && data.value !== "pending" && data.value !== "suspended" && data.value !== "removed") throw new Error("Invalid moderation status.");
        update = { moderation_status: data.value };
        break;
    }
    const { error } = await supabaseAdmin.from("listings").update(update).eq("id", data.listingId);
    if (error) throw new Error("Could not update this listing.");
    return { ok: true };
  });

export const createVerificationPhotoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { listingId: string; kind: "identity" | "business" }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: listing, error } = await supabaseAdmin.from("listings").select("verification_identity_path, verification_business_path").eq("id", data.listingId).maybeSingle();
    if (error || !listing) throw new Error("Could not open verification document.");
    const path = data.kind === "identity" ? listing.verification_identity_path : listing.verification_business_path;
    if (!path) throw new Error("This document has not been uploaded.");
    const { data: signed, error: signedError } = await supabaseAdmin.storage.from("listing-media").createSignedUrl(path, 60);
    if (signedError || !signed) throw new Error("Could not open verification document.");
    return { url: signed.signedUrl };
  });