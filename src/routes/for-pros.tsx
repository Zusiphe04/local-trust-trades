import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRO_PRICE } from "@/lib/directory";

export const Route = createFileRoute("/for-pros")({
  head: () => ({
    meta: [
      { title: "List your business — LocalPro for Pros" },
      { name: "description", content: "Get found by local customers. Start free, or go Pro for top placement, a Verified badge and lead analytics." },
      { property: "og:title", content: "List your business — LocalPro for Pros" },
      { property: "og:description", content: "Start free, or go Pro for top placement and a Verified badge." },
    ],
  }),
  component: ForPros,
});

export const PLAN_FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: "Listed in search results", free: true, pro: true },
  { label: "Phone number on your listing", free: true, pro: true },
  { label: "Photos", free: true, pro: true },
  { label: "Top search priority (Featured Pros)", free: false, pro: true },
  { label: "“Verified Pro” badge", free: false, pro: true },
  { label: "Unlimited portfolio gallery", free: false, pro: true },
  { label: "Email, website & social links", free: false, pro: true },
  { label: "Reply to reviews", free: false, pro: true },
  { label: "Lead analytics", free: false, pro: true },
];

function ForPros() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="max-w-2xl text-4xl font-bold">Get more local jobs. Pay only if you want top placement.</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Customers in your area are already searching. Set up your listing in about five minutes.</p>
      <PlanCards />
    </div>
  );
}

export function PlanCards({ onChoose }: { onChoose?: (p: "free" | "pro") => void }) {
  const plans = [
    { id: "free" as const, name: "Basic", price: 0, blurb: "Get on the map.", photos: "2 photos max" },
    { id: "pro" as const, name: "Pro", price: PRO_PRICE, blurb: "Win more of the jobs you want.", photos: "Unlimited photos" },
  ];
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2">
      {plans.map((p) => (
        <div key={p.id} className={`flex flex-col rounded-md border bg-card p-6 ${p.id === "pro" ? "border-primary ring-1 ring-primary" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{p.name}</h2>
            {p.id === "pro" && <span className="rounded-sm bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Most leads</span>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
          <p className="mt-4"><span className="font-display text-4xl font-bold">${p.price}</span><span className="text-muted-foreground">/mo</span></p>
          <ul className="mt-6 flex-1 space-y-2 text-sm">
            {PLAN_FEATURES.map((f) => {
              const on = p.id === "pro" ? f.pro : f.free;
              return (
                <li key={f.label} className={`flex items-center gap-2 ${on ? "" : "text-muted-foreground line-through"}`}>
                  {on ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4" />}
                  {f.label === "Photos" ? p.photos : f.label}
                </li>
              );
            })}
          </ul>
          {onChoose ? (
            <Button className="mt-6" variant={p.id === "pro" ? "default" : "outline"} onClick={() => onChoose(p.id)}>
              {p.id === "pro" ? "Choose Pro" : "Start free"}
            </Button>
          ) : (
            <Button asChild className="mt-6" variant={p.id === "pro" ? "default" : "outline"}>
              <Link to="/auth" search={{ provider: true, mode: "signup" }}>{p.id === "pro" ? "Get started with Pro" : "Start free"}</Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
