import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Phone, Inbox, Lock, Trash2, Mail, MessageSquare, Send, CreditCard, Landmark, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ListingForm } from "@/components/directory/ListingForm";
import { Stars, VerifiedBadge } from "@/components/directory/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRO_PRICE, PRO_ANNUAL_PRICE, getUserRole, uploadMedia, type Listing } from "@/lib/directory";
import { cancelSubscription } from "@/lib/billing.functions";
import { PlanCards } from "@/routes/for-pros";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LocalPro" },
      { name: "description", content: "Manage your listing, photos, reviews and leads." },
      { property: "og:title", content: "Dashboard — LocalPro" },
      { property: "og:description", content: "Manage your LocalPro listing." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if ((await getUserRole(context.user.id)) !== "provider") throw redirect({ to: "/search" });
  },
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const key = ["dashboard", user.id];
  const { data, isLoading } = useQuery({
    queryKey: key,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data: listing } = await supabase.from("listings").select("*").eq("user_id", user.id).maybeSingle();
      if (!listing) return { listing: null };
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const [g, r, i, ev] = await Promise.all([
        supabase.from("gallery_images").select("*").eq("listing_id", listing.id).order("created_at"),
        supabase.from("reviews").select("*").eq("listing_id", listing.id).order("created_at", { ascending: false }),
        supabase.from("inquiries").select("*").eq("listing_id", listing.id).order("created_at", { ascending: false }),
        supabase.from("listing_events").select("event_type, created_at").eq("listing_id", listing.id).gte("created_at", since).limit(5000),
      ]);
      return { listing, gallery: g.data ?? [], reviews: r.data ?? [], inquiries: i.data ?? [], events: ev.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading your dashboard…</div>;

  if (!data?.listing)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-bold">Let's get your business listed</h1>
        <p className="mt-2 text-muted-foreground">Create your profile to start getting quote requests and reviews.</p>
        <div className="mt-6 flex gap-2">
          <Button asChild><Link to="/onboarding">Create my listing</Link></Button>
        </div>
      </div>
    );

  const { listing, gallery, reviews, inquiries, events } = data;
  const isPro = listing.plan_type === "pro";
  const views = events.filter((e) => e.event_type === "view").length;
  const calls = events.filter((e) => e.event_type === "phone_click").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{listing.business_name}</h1>
            {isPro && <VerifiedBadge />}
          </div>
          <p className="text-sm text-muted-foreground">{isPro ? "Pro plan" : "Basic (free) plan"} · {listing.category} · {listing.service_area}</p>
        </div>
        <Button asChild variant="outline"><Link to="/pro/$id" params={{ id: listing.id }}>View public listing</Link></Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Eye} label="Profile views (30 days)" value={views} />
        <Stat icon={Phone} label="Phone clicks (30 days)" value={calls} />
        <Stat icon={Inbox} label="Quote requests" value={inquiries.length} />
      </div>

      <Tabs defaultValue="leads" className="mt-8">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="leads">Inquiries & Leads{inquiries.length ? ` (${inquiries.length})` : ""}</TabsTrigger>
          <TabsTrigger value="details">Business details</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="reviews">Reviews{reviews.length ? ` (${reviews.length})` : ""}</TabsTrigger>
          <TabsTrigger value="billing">Billing & Subscription</TabsTrigger>
          <TabsTrigger value="payments">Payment options</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4 space-y-4">
          {isPro ? <LeadChart events={events} /> : <Locked text="Daily lead analytics are included with Pro." />}
          <div className="space-y-3">
            {inquiries.map((q) => <LeadCard key={q.id} lead={q} businessName={listing.business_name} />)}
            {inquiries.length === 0 && <p className="text-sm text-muted-foreground">No quote requests yet. A complete profile with photos gets more of them.</p>}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <div className="rounded-md border bg-card p-6">
            <ListingForm
              userId={user.id}
              initial={listing}
              isPro={isPro}
              submitLabel="Save changes"
              onSubmit={async (v) => {
                const { error } = await supabase.from("listings").update(v).eq("id", listing.id);
                if (error) toast.error(error.message);
                else { toast.success("Saved."); refresh(); }
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Gallery userId={user.id} listingId={listing.id} isPro={isPro} images={gallery} onChange={refresh} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-3">
          {!isPro && <Locked text="Replying to reviews is included with Pro." />}
          {reviews.map((r) => <ReviewItem key={r.id} review={r} canReply={isPro} onChange={refresh} />)}
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Ask your happy customers to leave one.</p>}
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <BillingTab listing={listing} isPro={isPro} onChange={refresh} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentOptionsForm userId={user.id} listing={listing} onSaved={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type Lead = { id: string; customer_name: string; customer_email: string; customer_phone: string | null; message: string; answers: unknown; photo_path: string | null; created_at: string };

function LeadCard({ lead, businessName }: { lead: Lead; businessName: string }) {
  const answers = (lead.answers && typeof lead.answers === "object" ? lead.answers : {}) as Record<string, string>;
  const entries = Object.entries(answers);
  const summary = entries.map(([k, v]) => `${k}: ${v}`).join(" | ");
  const { data: photoUrl } = useQuery({
    queryKey: ["lead-photo", lead.photo_path],
    enabled: !!lead.photo_path,
    staleTime: 30 * 60e3,
    queryFn: async () => lead.photo_path ? (await supabase.storage.from("listing-media").createSignedUrl(lead.photo_path, 3600)).data?.signedUrl ?? null : null,
  });
  const first = lead.customer_name.split(" ")[0];
  const job = answers["Job Type"] || answers["Task"] || "your job";
  const quoteBody = `Hi ${first},\n\nThanks for reaching out to ${businessName} about ${job}.\n\nYour request: ${summary || lead.message}\n\nOur estimate: R___ \nEarliest availability: ___\n\nReply to this email to book, or call us anytime.\n\n— ${businessName}`;
  const quoteHref = `mailto:${lead.customer_email}?subject=${encodeURIComponent(`Your quote from ${businessName}`)}&body=${encodeURIComponent(quoteBody)}`;
  const pref = answers["Preferred Contact"];
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <span className="font-semibold">{lead.customer_name}</span>
        <span className="text-muted-foreground">{new Date(lead.created_at).toLocaleString()}</span>
      </div>
      {entries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entries.map(([k, v]) => (
            <span key={k} className="rounded-sm border bg-muted px-2 py-1 text-xs">
              <span className="text-muted-foreground">{k}:</span> <span className="font-medium">{v}</span>
            </span>
          ))}
        </div>
      )}
      {lead.message && lead.message !== summary && <p className="mt-3 text-sm">{lead.message}</p>}
      {photoUrl && <a href={photoUrl} target="_blank" rel="noreferrer"><img src={photoUrl} alt="Customer job photo" className="mt-3 h-28 rounded-md border object-cover" /></a>}
      <div className="mt-2 text-xs text-muted-foreground">
        {lead.customer_email}{lead.customer_phone ? ` · ${lead.customer_phone}` : ""}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {lead.customer_phone && (
          <Button asChild size="sm" variant={pref === "Call" ? "default" : "outline"}>
            <a href={`tel:${lead.customer_phone}`}><Phone className="h-4 w-4" /> Call</a>
          </Button>
        )}
        {lead.customer_phone && pref === "Text" && (
          <Button asChild size="sm"><a href={`sms:${lead.customer_phone}`}><MessageSquare className="h-4 w-4" /> Text</a></Button>
        )}
        <Button asChild size="sm" variant={pref === "Email" ? "default" : "outline"}>
          <a href={`mailto:${lead.customer_email}`}><Mail className="h-4 w-4" /> Email</a>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <a href={quoteHref}><Send className="h-4 w-4" /> Send Quick Quote</a>
        </Button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function Locked({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted p-4 text-sm text-muted-foreground">
      <Lock className="h-4 w-4" /> {text}
    </div>
  );
}

function LeadChart({ events }: { events: { event_type: string; created_at: string }[] }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
    const day = events.filter((e) => e.created_at.slice(0, 10) === d);
    return { d, views: day.filter((e) => e.event_type === "view").length, calls: day.filter((e) => e.event_type !== "view").length };
  });
  const max = Math.max(1, ...days.map((d) => d.views));
  return (
    <div className="rounded-md border bg-card p-5">
      <h3 className="text-sm font-semibold">Last 14 days</h3>
      <div className="mt-4 flex h-32 items-end gap-1.5">
        {days.map((d) => (
          <div key={d.d} className="flex flex-1 flex-col items-center gap-1" title={`${d.d}: ${d.views} views, ${d.calls} contacts`}>
            <div className="w-full rounded-t-sm bg-primary/80" style={{ height: `${(d.views / max) * 100}%`, minHeight: 2 }} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Bars show daily profile views. Hover a day for contact clicks.</p>
    </div>
  );
}

function Gallery({ userId, listingId, isPro, images, onChange }: { userId: string; listingId: string; isPro: boolean; images: { id: string; image_url: string }[]; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const full = !isPro && images.length >= 2;
  return (
    <div className="rounded-md border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{isPro ? "Unlimited photos on Pro." : `${images.length} of 2 photos used on Basic.`}</p>
        <Input
          type="file"
          accept="image/*"
          multiple={isPro}
          disabled={busy || full}
          className="max-w-xs"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            setBusy(true);
            for (const file of files) {
              try {
                const url = await uploadMedia(userId, file);
                const { error } = await supabase.from("gallery_images").insert({ listing_id: listingId, image_url: url });
                if (error) { toast.error(error.message); break; }
              } catch { toast.error("Upload failed."); break; }
            }
            setBusy(false);
            onChange();
          }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((g) => (
          <div key={g.id} className="group relative">
            <img src={g.image_url} alt="" className="aspect-square w-full rounded-md border object-cover" />
            <Button
              size="icon"
              variant="destructive"
              className="absolute right-2 top-2 h-8 w-8"
              aria-label="Remove photo"
              onClick={async () => { await supabase.from("gallery_images").delete().eq("id", g.id); onChange(); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {full && <p className="mt-4 text-sm text-muted-foreground">Want to show more of your work? Pro includes an unlimited gallery.</p>}
    </div>
  );
}

function ReviewItem({ review, canReply, onChange }: { review: { id: string; reviewer_name: string; rating: number; comment: string; provider_reply: string | null }; canReply: boolean; onChange: () => void }) {
  const [text, setText] = useState(review.provider_reply ?? "");
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex items-center gap-2"><span className="font-medium">{review.reviewer_name}</span><Stars value={review.rating} size={14} /></div>
      <p className="mt-1 text-sm">{review.comment}</p>
      {canReply ? (
        <div className="mt-3 space-y-2">
          <Textarea rows={2} value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Write a public reply…" />
          <Button size="sm" onClick={async () => {
            const { error } = await supabase.from("reviews").update({ provider_reply: text.trim() || null }).eq("id", review.id);
            if (error) toast.error(error.message); else { toast.success("Reply posted."); onChange(); }
          }}>{review.provider_reply ? "Update reply" : "Reply to review"}</Button>
        </div>
      ) : review.provider_reply ? (
        <p className="mt-2 border-l-2 border-primary pl-3 text-sm text-muted-foreground">{review.provider_reply}</p>
      ) : null}
    </div>
  );
}
