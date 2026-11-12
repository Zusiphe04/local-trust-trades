import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SlidersHorizontal } from "lucide-react";
import { SearchBar } from "@/components/directory/SearchBar";
import { ListingCard } from "@/components/directory/ListingCard";
import { CATEGORIES } from "@/lib/directory";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const searchSchema = z.object({
  q: z.string().optional(),
  loc: z.string().optional(),
  cat: z.string().optional(),
  rating4: z.boolean().optional(),
  verified: z.boolean().optional(),
});
type S = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search local pros — LocalPro" },
      { name: "description", content: "Browse and filter local service pros by category, rating and verified status." },
      { property: "og:title", content: "Search local pros — LocalPro" },
      { property: "og:description", content: "Filter local pros by category, rating and verified status." },
    ],
  }),
  component: SearchPage,
});

function clean(s: string) {
  return s.replace(/[%,()]/g, " ").trim();
}

function SearchPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const set = (patch: Partial<S>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const { data, isLoading } = useQuery({
    queryKey: ["search", s],
    queryFn: async () => {
      let qb = supabase.from("listings").select("*");
      if (s.q) {
        const t = clean(s.q);
        qb = qb.or(`business_name.ilike.%${t}%,category.ilike.%${t}%,bio.ilike.%${t}%`);
      }
      if (s.loc) qb = qb.ilike("service_area", `%${clean(s.loc)}%`);
      if (s.cat) qb = qb.eq("category", s.cat);
      if (s.rating4) qb = qb.gte("rating", 4);
      if (s.verified) qb = qb.eq("is_verified", true);
      const { data, error } = await qb.order("rating", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const featured = data?.filter((l) => l.is_featured && l.plan_type === "pro") ?? [];
  const organic = data?.filter((l) => !(l.is_featured && l.plan_type === "pro")) ?? [];

  const filters = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Category</h3>
        <div className="space-y-1">
          <button onClick={() => set({ cat: undefined })} className={`block w-full rounded-sm px-2 py-1 text-left text-sm ${!s.cat ? "bg-accent font-medium text-accent-foreground" : "hover:bg-muted"}`}>
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => set({ cat: c })} className={`block w-full rounded-sm px-2 py-1 text-left text-sm ${s.cat === c ? "bg-accent font-medium text-accent-foreground" : "hover:bg-muted"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Filter by</h3>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={!!s.rating4} onCheckedChange={(v) => set({ rating4: v ? true : undefined })} /> 4+ stars
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={!!s.verified} onCheckedChange={(v) => set({ verified: v ? true : undefined })} /> Verified Pros only
        </label>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchBar key={`${s.q}-${s.loc}`} initialQ={s.q} initialLoc={s.loc} compact />
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {s.cat ?? (s.q ? `“${s.q}”` : "All pros")}
              {s.loc && <span className="font-normal text-muted-foreground"> near {s.loc}</span>}
            </h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="px-4">{filters}</div>
              </SheetContent>
            </Sheet>
          </div>

          {isLoading && <p className="text-muted-foreground">Finding pros…</p>}

          {featured.length > 0 && (
            <section className="mb-8 rounded-md border bg-featured p-4">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured Pros</h2>
              <div className="flex flex-col gap-3">
                {featured.map((l) => <ListingCard key={l.id} listing={l} featured />)}
              </div>
            </section>
          )}

          {data && (
            <>
              <p className="mb-3 text-sm text-muted-foreground">{organic.length} more {organic.length === 1 ? "result" : "results"}</p>
              <div className="flex flex-col gap-3">
                {organic.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
              {data.length === 0 && (
                <div className="rounded-md border bg-card p-8 text-center">
                  <p className="font-medium">No pros match those filters yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a nearby city, a broader service, or clear your filters.</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate({ search: {} })}>Clear all</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
