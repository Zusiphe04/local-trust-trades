import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Activity, BadgeCheck, Building2, CreditCard, FileCheck2, Flag, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { PRO_PRICE } from "@/lib/localization";
import { createVerificationPhotoUrl, getAdminOverview, updateAdminListing } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Administrator dashboard — LocalPro" },
    { name: "description", content: "Manage LocalPro provider verification, subscriptions, listing moderation and platform analytics." },
    { property: "og:title", content: "Administrator dashboard — LocalPro" },
    { property: "og:description", content: "Private operations dashboard for LocalPro administrators." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
    const { data: role, error } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
    if (error || role?.role !== "admin") {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const queryClient = useQueryClient();
  const loadOverview = useServerFn(getAdminOverview);
  const changeListing = useServerFn(updateAdminListing);
  const openVerificationFile = useServerFn(createVerificationPhotoUrl);
  const [query, setQuery] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => loadOverview(),
    staleTime: 30_000,
  });

  const listings = data?.listings ?? [];
  const providers = data?.roles.filter((role) => role.role === "provider").length ?? 0;
  const customers = data?.roles.filter((role) => role.role === "customer").length ?? 0;
  const activePro = listings.filter((listing) => listing.plan_type === "pro" && listing.subscription_status === "active").length;
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const monthlyLeads = data?.inquiries.filter((lead) => new Date(lead.created_at) >= thisMonth).length ?? 0;
  const monthlyRevenue = activePro * PRO_PRICE;
  const verificationQueue = listings.filter((listing) => listing.verification_status === "pending");
  const filteredListings = useMemo(() => listings.filter((listing) => {
    const matchesQuery = `${listing.business_name} ${listing.category} ${listing.service_area}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (!flaggedOnly || listing.is_flagged);
  }), [listings, query, flaggedOnly]);

  function setLocalListing(listingId: string, action: string, value?: string | boolean) {
    queryClient.setQueryData(["admin-overview"], (current: typeof data | undefined) => {
      if (!current) return current;
      return { ...current, listings: current.listings.map((listing) => {
        if (listing.id !== listingId) return listing;
        if (action === "approve" || action === "verified") return { ...listing, is_verified: value === false ? false : true, verification_status: value === false ? "rejected" : "approved" };
        if (action === "reject") return { ...listing, is_verified: false, verification_status: "rejected" };
        if (action === "upgrade") return { ...listing, plan_type: "pro", is_featured: true, subscription_status: "active" };
        if (action === "downgrade") return { ...listing, plan_type: "free", is_featured: false, subscription_status: "cancelled", next_billing_date: null, payment_method_label: null };
        if (action === "flagged") return { ...listing, is_flagged: value === true };
        if (action === "moderation" && typeof value === "string") return { ...listing, moderation_status: value };
        return listing;
      }) };
    });
  }

  async function update(listingId: string, action: "approve" | "reject" | "upgrade" | "downgrade" | "verified" | "flagged" | "moderation", value?: string | boolean) {
    setBusyId(listingId);
    try {
      await changeListing({ data: { listingId, action, value } });
      setLocalListing(listingId, action, value);
      toast.success("Listing updated.");
    } catch {
      toast.error("Could not update this listing. Refresh and try again.");
      await refetch();
    } finally {
      setBusyId(null);
    }
  }

  async function viewDocument(listingId: string, kind: "identity" | "business") {
    try {
      const { url } = await openVerificationFile({ data: { listingId, kind } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open this document.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><ShieldCheck className="h-4 w-4" /> LocalPro operations</p>
          <h1 className="mt-1 text-3xl font-bold">Administrator dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review providers, manage listings and monitor the directory.</p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}><Activity className="h-4 w-4" /> Refresh overview</Button>
      </header>

      {isError && <div role="alert" className="mt-6 rounded-md border border-destructive/40 bg-card p-4 text-sm">The administrator overview could not be loaded. Please refresh and try again.</div>}
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi icon={Users} label="Total customers" value={customers} />
        <Kpi icon={Building2} label="Service providers" value={providers} />
        <Kpi icon={CreditCard} label="Active Pro subscriptions" value={activePro} />
        <Kpi icon={FileCheck2} label="Leads this month" value={monthlyLeads} />
        <Kpi icon={CreditCard} label="Estimated monthly revenue" value={`R${monthlyRevenue.toLocaleString("en-ZA")}`} note="Run-rate from active Pro plans; billing history is not recorded." />
      </div>

      {isLoading ? <p className="py-12 text-center text-muted-foreground">Loading administrator data…</p> : data && (
        <Tabs defaultValue="verification" className="mt-8">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="verification">Provider verifications {verificationQueue.length ? `(${verificationQueue.length})` : ""}</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="moderation">Listing moderation</TabsTrigger>
            <TabsTrigger value="analytics">Platform analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="mt-4">
            <PanelTitle title="Provider verifications" description="Only uploaded files are available to review. Files open using short-lived private links." />
            {verificationQueue.length === 0 ? <EmptyState title="No pending verification applications" text="Submitted provider documents will appear here for review." /> : (
              <div className="mt-4 overflow-x-auto rounded-md border bg-card">
                <Table><TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Identity document</TableHead><TableHead>Registration document</TableHead><TableHead className="text-right">Decision</TableHead></TableRow></TableHeader>
                  <TableBody>{verificationQueue.map((listing) => <TableRow key={listing.id}>
                    <TableCell><p className="font-semibold">{listing.business_name}</p><p className="text-xs text-muted-foreground">{listing.category} · {listing.service_area}</p></TableCell>
                    <TableCell><DocumentButton exists={!!listing.verification_identity_path} label="View identity" onClick={() => void viewDocument(listing.id, "identity")} /></TableCell>
                    <TableCell><DocumentButton exists={!!listing.verification_business_path} label="View registration" onClick={() => void viewDocument(listing.id, "business")} /></TableCell>
                    <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={busyId === listing.id} onClick={() => void update(listing.id, "reject")}>Reject</Button><Button size="sm" disabled={busyId === listing.id || !listing.verification_identity_path || !listing.verification_business_path} onClick={() => void update(listing.id, "approve")}>Approve</Button></div></TableCell>
                  </TableRow>)}</TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            <PanelTitle title="Subscription manager" description="Payment gateway indicators reflect provider-configured methods; tier changes here are administrative overrides." />
            {listings.length === 0 ? <EmptyState title="No provider listings yet" text="New business listings will appear here." /> : <ListingTable listings={listings} busyId={busyId} action={(listing) => listing.plan_type === "pro" ? update(listing.id, "downgrade") : update(listing.id, "upgrade")} mode="subscription" />}
          </TabsContent>

          <TabsContent value="moderation" className="mt-4">
            <PanelTitle title="Listing moderation" description="Flag listings for review or pause their public visibility. Removed and suspended listings stay hidden from the directory." />
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search business, service or area" /></div>
              <Button variant={flaggedOnly ? "default" : "outline"} onClick={() => setFlaggedOnly(!flaggedOnly)}><Flag className="h-4 w-4" /> {flaggedOnly ? "Showing flagged" : "Flagged only"}</Button>
            </div>
            {filteredListings.length === 0 ? <EmptyState title={flaggedOnly ? "No flagged listings" : "No matching listings"} text={flaggedOnly ? "Flag a listing to queue it for follow-up." : "Try a different search."} /> : <ListingTable listings={filteredListings} busyId={busyId} mode="moderation" action={(listing) => update(listing.id, "flagged", !listing.is_flagged)} statusAction={(listing, value) => update(listing.id, "moderation", value)} />}
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-5">
            <PanelTitle title="Platform analytics" description="Counts come from existing account, listing, inquiry and subscription records." />
            <div className="grid gap-4 sm:grid-cols-2">
              <MonthlyChart title="Quote requests by month" records={data.inquiries} />
              <MonthlyChart title="Estimated Pro run-rate by month" records={data.events} value={activePro * PRO_PRICE} suffix=" Rand" note="Illustrative run-rate based on today’s active subscriptions; historical billing is not tracked." />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi icon={BadgeCheck} label="Verified businesses" value={listings.filter((listing) => listing.is_verified).length} />
              <Kpi icon={Building2} label="Active listings" value={listings.filter((listing) => listing.moderation_status === "active").length} />
              <Kpi icon={FileCheck2} label="Reviews received" value={data.reviews.length} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

type IconType = typeof Users;
function Kpi({ icon: Icon, label, value, note }: { icon: IconType; label: string; value: string | number; note?: string }) {
  return <div className="rounded-md border bg-card p-4"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</p><p className="mt-2 font-display text-2xl font-bold">{value}</p>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</div>;
}

function PanelTitle({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="mt-4 rounded-md border border-dashed bg-card px-6 py-10 text-center"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>;
}

function DocumentButton({ exists, label, onClick }: { exists: boolean; label: string; onClick: () => void }) {
  return exists ? <Button size="sm" variant="outline" onClick={onClick}><FileCheck2 className="h-4 w-4" />{label}</Button> : <span className="text-sm text-muted-foreground">Not submitted</span>;
}

type Listing = Awaited<ReturnType<typeof getAdminOverview>>["listings"][number];
function ListingTable({ listings, busyId, mode, action, statusAction }: {
  listings: Listing[];
  busyId: string | null;
  mode: "subscription" | "moderation";
  action: (listing: Listing) => void;
  statusAction?: (listing: Listing, value: string) => void;
}) {
  return <div className="mt-4 overflow-x-auto rounded-md border bg-card"><Table>
    <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Plan</TableHead><TableHead>Payment setup</TableHead>{mode === "moderation" && <TableHead>Visibility</TableHead>}<TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
    <TableBody>{listings.map((listing) => {
      const gateways = [listing.payfast_link ? "PayFast" : null, listing.accepts_snapscan ? "SnapScan" : null, listing.accepts_eft ? "EFT" : null, listing.accepts_card ? "Card" : null].filter(Boolean);
      return <TableRow key={listing.id}>
        <TableCell><p className="font-semibold">{listing.business_name}</p><p className="text-xs text-muted-foreground">{listing.category} · {listing.service_area}</p>{listing.is_verified && <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}</TableCell>
        <TableCell><span className="font-medium">{listing.plan_type === "pro" ? "Pro" : "Basic"}</span><span className="block text-xs text-muted-foreground">{listing.subscription_status}</span></TableCell>
        <TableCell>{gateways.length ? <span className="text-sm">{gateways.join(" · ")}</span> : <span className="text-sm text-muted-foreground">Not configured</span>}</TableCell>
        {mode === "moderation" && <TableCell><Select value={listing.moderation_status} onValueChange={(value) => statusAction?.(listing, value)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="removed">Removed</SelectItem></SelectContent></Select></TableCell>}
        <TableCell><div className="flex flex-wrap justify-end gap-2">{mode === "moderation" && <Button size="sm" variant={listing.is_flagged ? "secondary" : "outline"} disabled={busyId === listing.id} onClick={() => action(listing)}><Flag className="h-4 w-4" />{listing.is_flagged ? "Unflag" : "Flag"}</Button>}<Button size="sm" variant={listing.plan_type === "pro" ? "outline" : "default"} disabled={busyId === listing.id} onClick={() => action(listing)}>{listing.plan_type === "pro" ? "Set Basic" : "Activate Pro"}</Button></div></TableCell>
      </TableRow>;
    })}</TableBody>
  </Table></div>;
}

function MonthlyChart({ title, records, value, suffix = " requests", note }: { title: string; records: { created_at: string }[]; value?: number; suffix?: string; note?: string }) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - (5 - index));
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return { date, count: records.filter((record) => new Date(record.created_at) >= date && new Date(record.created_at) < next).length };
  });
  const max = Math.max(1, ...months.map((month) => month.count));
  return <section className="rounded-md border bg-card p-5"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{note ?? "Based on recorded quote requests."}</p><div className="mt-5 flex h-36 items-end gap-3" aria-label={title}>
    {months.map(({ date, count }) => <div key={date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs text-muted-foreground">{value !== undefined ? `R${value.toLocaleString("en-ZA")}` : count}</span><div className="w-full rounded-t-sm bg-primary/80" style={{ height: `${Math.max(value !== undefined ? 15 : count ? 12 : 3, (count / max) * 100)}%` }} title={`${date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}: ${value !== undefined ? `R${value.toLocaleString("en-ZA")}` : `${count}${suffix}`}`} /><span className="text-xs text-muted-foreground">{date.toLocaleDateString("en-ZA", { month: "short" })}</span></div>)}
  </div></section>;
}