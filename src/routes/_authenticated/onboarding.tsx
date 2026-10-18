import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PlanCards } from "@/routes/for-pros";
import { ListingForm } from "@/components/directory/ListingForm";
import { Button } from "@/components/ui/button";
import { PRO_PRICE, getUserRole } from "@/lib/directory";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your listing — LocalPro" },
      { name: "description", content: "Choose a plan and build your business profile." },
      { property: "og:title", content: "Set up your listing — LocalPro" },
      { property: "og:description", content: "Choose a plan and build your business profile." },
    ],
  }),
  component: Onboarding,
  beforeLoad: async ({ context }) => {
    if (await getUserRole(context.user.id) !== "provider") throw redirect({ to: "/search" });
  },
});

function Onboarding() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [plan, setPlan] = useState<"free" | "pro">("free");

  const { data: existing } = useQuery({
    queryKey: ["my-listing", user.id],
    queryFn: async () => (await supabase.from("listings").select("id").eq("user_id", user.id).maybeSingle()).data,
  });

  if (existing)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-bold">You're already listed.</h1>
        <Button asChild className="mt-4"><Link to="/dashboard">Go to your dashboard</Link></Button>
      </div>
    );

  const steps = ["Choose plan", "Payment", "Business profile"];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ol className="flex gap-2 text-sm">
        {steps.map((s, i) => (
          <li key={s} className={`flex-1 border-t-4 pt-2 ${i + 1 <= step ? "border-primary font-semibold" : "border-border text-muted-foreground"}`}>
            Step {i + 1}: {s}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <>
          <h1 className="mt-8 text-3xl font-bold">Pick how you want to show up.</h1>
          <PlanCards onChoose={(p) => { setPlan(p); setStep(p === "pro" ? 2 : 3); }} />
        </>
      )}

      {step === 2 && (
        <div className="mt-8 max-w-xl rounded-md border bg-card p-6">
          <h1 className="text-2xl font-bold">Pro — R{PRO_PRICE}/month</h1>
          <p className="mt-2 text-muted-foreground">
            Card checkout for Pro is being switched on. For now we'll create your listing on Basic — you can upgrade to Pro from your dashboard as soon as checkout opens, and nothing you enter will be lost.
          </p>
          <div className="mt-6 flex gap-2">
            <Button onClick={() => setStep(3)}>Continue on Basic for now</Button>
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8">
          <h1 className="text-3xl font-bold">Build your business profile</h1>
          <p className="mt-1 text-muted-foreground">This is what customers see. Clear, specific listings get more calls.</p>
          <div className="mt-6 rounded-md border bg-card p-6">
            <ListingForm
              userId={user.id}
              isPro={false}
              submitLabel="Publish my listing"
              onSubmit={async (v) => {
                const { error } = await supabase.from("listings").insert({ ...v, user_id: user.id });
                if (error) {
                  toast.error(error.message);
                  return;
                }
                toast.success(plan === "pro" ? "You're live on Basic. Upgrade to Pro anytime." : "You're live!");
                navigate({ to: "/dashboard" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
