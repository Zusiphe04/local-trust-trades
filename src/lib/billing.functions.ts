import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Cancels the caller's Pro subscription: downgrades their own listing to the
 * free plan. plan_type is protected by the protect_listing_plan trigger, so
 * the privileged client is required — but only after ownership is verified
 * through the caller's own RLS-scoped client.
 */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: listing } = await supabase
      .from("listings")
      .select("id, plan_type")
      .eq("user_id", userId)
      .maybeSingle();
    if (!listing) throw new Error("No listing found for this account.");
    if (listing.plan_type !== "pro") return { ok: true, alreadyFree: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("listings")
      .update({
        plan_type: "free",
        is_featured: false,
        subscription_status: "cancelled",
        next_billing_date: null,
        payment_method_label: null,
      })
      .eq("id", listing.id);
    if (error) throw new Error(error.message);
    return { ok: true, alreadyFree: false };
  });
