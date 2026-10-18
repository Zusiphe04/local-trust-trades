import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, MessageSquare, ArrowUpRight, ShieldCheck } from "lucide-react";
import { SearchBar } from "@/components/directory/SearchBar";
import { ListingCard } from "@/components/directory/ListingCard";
import { CATEGORIES } from "@/lib/directory";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import hero from "@/assets/trades-hero.jpg";
import electrician from "@/assets/electrician.jpg";
import solar from "@/assets/solar.jpg";
import cleaning from "@/assets/cleaning.jpg";
import handyman from "@/assets/handyman.jpg";
import { useSession } from "@/hooks/use-session";
import { getUserRole } from "@/lib/directory";

const SHOWCASE = [
  { category: "Plumber", title: "Plumbing", image: hero, copy: "Leaks, geysers & blocked drains" },
  { category: "Electrician", title: "Electrical", image: electrician, copy: "Repairs, wiring & compliance" },
  { category: "Solar & Inverter Installer", title: "Solar & Inverter", image: solar, copy: "Loadshedding Solutions" },
  { category: "Home Cleaning", title: "Home Cleaning", image: cleaning, copy: "A fresh start for your home" },
  { category: "Handyman", title: "Handyman", image: handyman, copy: "Small jobs. Properly done." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalPro — Find local service pros in South Africa" },
      { name: "description", content: "Find South African plumbers, electricians, solar installers and cleaners. Compare reviews and request free quotes." },
      { property: "og:title", content: "LocalPro — Find local service pros in South Africa" },
      { property: "og:description", content: "Compare real reviews and contact trusted local pros directly." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useSession();
  const { data: role } = useQuery({ queryKey: ["role", user?.id], queryFn: () => user ? getUserRole(user.id) : Promise.resolve("customer"), enabled: !!user });
  const { data: featured } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("*").eq("is_featured", true).order("rating", { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  return (
    <>
      <section className="relative isolate border-b">
        <img src={hero} alt="South African plumber at work in a Cape Town home" width={1536} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay/65" />
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:pt-16">
          <p className="flex items-center gap-2 text-sm font-semibold text-hero-foreground"><ShieldCheck className="h-4 w-4" /> LOCAL SKILLS. REAL PEOPLE. SOUTH AFRICA.</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight text-hero-foreground sm:text-5xl">
            Local service pros.<br />Right in your neighbourhood.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-hero-foreground">
            From a burst geyser to backup power. Find your pro, get free quotes, and get the job done.
          </p>
          <div className="mt-8 max-w-4xl">
            <SearchBar />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.slice(0, 4).map((c) => (
              <Link
                key={c}
                to="/search"
                search={{ cat: c }}
                 className="rounded-sm border border-hero-foreground/40 bg-hero-overlay/30 px-3 py-1.5 text-sm font-medium text-hero-foreground hover:bg-hero-overlay/60"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-primary">Around the home</p><h2 className="mt-1 text-2xl font-bold">What needs doing?</h2></div><Link to="/search" className="text-sm font-medium text-primary">All services →</Link></div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {SHOWCASE.map((s) => <Link key={s.category} to="/search" search={{ cat: s.category }} className="group overflow-hidden rounded-md border bg-card">
            <img src={s.image} alt={`${s.title} professional at work`} loading="lazy" width={768} height={1024} className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none" />
            <div className="p-3"><h3 className="flex items-center justify-between gap-1 text-sm font-semibold">{s.title}<ArrowUpRight className="h-4 w-4 shrink-0 text-primary" /></h3><p className="mt-1 text-xs text-muted-foreground">{s.copy}</p></div>
          </Link>)}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-9"><h2 className="text-2xl font-bold">How It Works</h2><div className="mt-6 grid gap-6 sm:grid-cols-3">
        {[
          { icon: Search, t: "1. Search Service", d: "Find local skills in your city, suburb or postal code." },
          { icon: MessageSquare, t: "2. Get Free Quotes", d: "Tell a pro what you need. Agree on the price directly." },
          { icon: Star, t: "3. Hire & Review", d: "Choose your pro. Share an honest review after the job." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t}>
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
        </div></div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Top-rated Featured Pros</h2>
          <Link to="/search" className="text-sm font-medium text-primary hover:underline">See all pros →</Link>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {featured?.map((l) => <ListingCard key={l.id} listing={l} featured />)}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Sample businesses and reviews shown for illustration. Contact details are not live.</p>
      </section>

      {(!user || role === "provider") && <section className="mt-12 border-y bg-accent">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Run a local service business?</h2>
            <p className="mt-1 text-muted-foreground">List it free in 5 minutes. Get calls from customers already searching for you.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/for-pros">List your business</Link>
          </Button>
        </div>
      </section>}
    </>
  );
}
