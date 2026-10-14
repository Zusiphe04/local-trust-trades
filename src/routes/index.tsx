import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Star, MessageSquare } from "lucide-react";
import { SearchBar } from "@/components/directory/SearchBar";
import { ListingCard } from "@/components/directory/ListingCard";
import { CATEGORIES } from "@/lib/directory";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalPro — Find verified local service pros near you" },
      { name: "description", content: "Search plumbers, electricians, cleaners, mechanics and more in your area. Compare real reviews and contact pros directly." },
      { property: "og:title", content: "LocalPro — Find verified local service pros near you" },
      { property: "og:description", content: "Compare real reviews and contact trusted local pros directly." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: featured } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("*").eq("is_featured", true).order("rating", { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  return (
    <>
      <section className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-16 sm:pt-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Trusted by homeowners in your area</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Find verified local service pros near you.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Read real reviews, compare prices, and call or message a pro directly. No middleman, no lead fees for you.
          </p>
          <div className="mt-8 max-w-4xl">
            <SearchBar />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                to="/search"
                search={{ cat: c }}
                className="rounded-full border bg-background px-4 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Verified Pros", d: "Look for the Verified Pro badge — these businesses have confirmed their details with us." },
          { icon: Star, t: "Real reviews", d: "Every rating comes from a signed-in customer. Pros can reply, but they can't delete." },
          { icon: MessageSquare, t: "Contact directly", d: "Call, email, or send a quote request. Your message goes straight to the business." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-md border bg-card p-5">
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Top-rated Featured Pros</h2>
          <Link to="/search" className="text-sm font-medium text-primary hover:underline">See all pros →</Link>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {featured?.map((l) => <ListingCard key={l.id} listing={l} featured />)}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-md border bg-card p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Run a local service business?</h2>
            <p className="mt-1 text-muted-foreground">List it free in 5 minutes. Get calls from customers already searching for you.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/for-pros">List your business</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
