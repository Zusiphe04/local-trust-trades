import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Clock, Globe, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { initials, trackEvent } from "@/lib/directory";
import { Stars, VerifiedBadge } from "@/components/directory/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/pro/$id")({
  head: () => ({
    meta: [
      { title: "Pro profile — LocalPro" },
      { name: "description", content: "See reviews, hours and contact details, and request a free quote." },
      { property: "og:title", content: "Pro profile — LocalPro" },
      { property: "og:description", content: "Reviews, hours and contact details for a local pro." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const [l, g, r] = await Promise.all([
        supabase.from("listings").select("*").eq("id", id).maybeSingle(),
        supabase.from("gallery_images").select("*").eq("listing_id", id).order("created_at"),
        supabase.from("reviews").select("*").eq("listing_id", id).order("created_at", { ascending: false }),
      ]);
      return { listing: l.data, gallery: g.data ?? [], reviews: r.data ?? [] };
    },
  });

  useEffect(() => {
    trackEvent(id, "view");
  }, [id]);

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading…</div>;
  const l = data?.listing;
  if (!l)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-2xl font-bold">This pro isn't listed anymore.</h1>
        <Link to="/search" className="mt-4 inline-block text-primary">Find another pro →</Link>
      </div>
    );
  const isPro = l.plan_type === "pro";
  const gallery = isPro ? data.gallery : data.gallery.slice(0, 2);

  return (
    <div>
      <div className="h-56 w-full border-b bg-muted sm:h-72">
        {l.cover_url && <img src={l.cover_url} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_340px]">
        <div className="-mt-12">
          <div className="flex items-end gap-4">
            {l.logo_url ? (
              <img src={l.logo_url} alt="" className="h-24 w-24 rounded-md border-4 border-card bg-card object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-md border-4 border-card bg-accent font-display text-2xl font-bold text-accent-foreground">
                {initials(l.business_name)}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{l.business_name}</h1>
            {isPro && <VerifiedBadge />}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Stars value={Number(l.rating)} />
              <span className="font-semibold text-foreground">{Number(l.rating).toFixed(1)}</span> ({l.review_count} reviews)
            </span>
            <span className="rounded-sm border px-1.5 py-0.5 text-xs font-medium text-foreground">{l.category}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{l.service_area}</span>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold">About</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{l.bio}</p>
          </section>

          {gallery.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold">Photos</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gallery.map((g) => (
                  <a key={g.id} href={g.image_url} target="_blank" rel="noreferrer">
                    <img src={g.image_url} alt="" className="aspect-square w-full rounded-md border object-cover" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <Reviews listingId={l.id} ownerId={l.user_id} reviews={data.reviews} />
        </div>

        <aside className="space-y-4 lg:pt-8">
          <div className="rounded-md border bg-card p-5">
            <h2 className="font-semibold">Contact</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {l.phone && (
                <li>
                  <a href={`tel:${l.phone}`} onClick={() => trackEvent(l.id, "phone_click")} className="flex items-center gap-2 font-medium hover:text-primary">
                    <Phone className="h-4 w-4 text-primary" />{l.phone}
                  </a>
                </li>
              )}
              {isPro && l.email && (
                <li>
                  <a href={`mailto:${l.email}`} onClick={() => trackEvent(l.id, "email_click")} className="flex items-center gap-2 hover:text-primary">
                    <Mail className="h-4 w-4 text-primary" />{l.email}
                  </a>
                </li>
              )}
              {isPro && l.website_url && (
                <li>
                  <a href={l.website_url} target="_blank" rel="noreferrer" onClick={() => trackEvent(l.id, "website_click")} className="flex items-center gap-2 hover:text-primary">
                    <Globe className="h-4 w-4 text-primary" />Visit website
                  </a>
                </li>
              )}
              {isPro && l.social_url && (
                <li>
                  <a href={l.social_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary">
                    <Share2 className="h-4 w-4 text-primary" />Social profile
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2 text-muted-foreground"><Clock className="mt-0.5 h-4 w-4 text-primary" />{l.hours}</li>
            </ul>
            {l.phone && (
              <Button asChild className="mt-4 w-full">
                <a href={`tel:${l.phone}`} onClick={() => trackEvent(l.id, "phone_click")}>Call now</a>
              </Button>
            )}
          </div>
          <InquiryForm listingId={l.id} />
        </aside>
      </div>
    </div>
  );
}

function InquiryForm({ listingId }: { listingId: string }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div id="inquiry" className="scroll-mt-24 rounded-md border bg-card p-5">
      <h2 className="font-semibold">Request a free quote</h2>
      {sent ? (
        <p className="mt-3 text-sm text-muted-foreground">Sent! The business will reply to your email, usually within a day.</p>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name")).trim();
            const email = String(f.get("email")).trim();
            const message = String(f.get("message")).trim();
            if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10) {
              toast.error("Add your name, a valid email and a few details about the job.");
              return;
            }
            setBusy(true);
            const { error } = await supabase.from("inquiries").insert({ listing_id: listingId, customer_name: name.slice(0, 100), customer_email: email.slice(0, 255), message: message.slice(0, 2000) });
            setBusy(false);
            if (error) toast.error("Couldn't send — please try again.");
            else setSent(true);
          }}
        >
          <div><Label htmlFor="name">Your name</Label><Input id="name" name="name" maxLength={100} /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" maxLength={255} /></div>
          <div><Label htmlFor="message">What do you need done?</Label><Textarea id="message" name="message" rows={4} maxLength={2000} placeholder="e.g. Kitchen sink leaking under the cabinet, available weekday mornings." /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send inquiry"}</Button>
        </form>
      )}
    </div>
  );
}

type ReviewRow = { id: string; reviewer_name: string; rating: number; comment: string; provider_reply: string | null; created_at: string };

function Reviews({ listingId, ownerId, reviews }: { listingId: string; ownerId: string | null; reviews: ReviewRow[] }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const isOwner = user && user.id === ownerId;
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold">Reviews ({reviews.length})</h2>
      <div className="mt-4 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.reviewer_name}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <Stars value={r.rating} size={14} className="mt-1" />
            <p className="mt-2 text-sm">{r.comment}</p>
            {r.provider_reply && (
              <div className="mt-3 border-l-2 border-primary bg-muted px-3 py-2 text-sm">
                <span className="font-semibold">Response from the business: </span>{r.provider_reply}
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Hired them? Be the first to review.</p>}
      </div>

      {!isOwner && (
        <div className="mt-6 rounded-md border bg-card p-5">
          <h3 className="font-semibold">Leave a review</h3>
          {!user ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link to="/auth" className="font-medium text-primary">Sign in</Link> to leave a review. It keeps ratings honest.
            </p>
          ) : (
            <form
              className="mt-3 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                const name = String(f.get("rname")).trim();
                const comment = String(f.get("comment")).trim();
                if (!name || !comment) { toast.error("Add your name and a short comment."); return; }
                setBusy(true);
                const { error } = await supabase.from("reviews").insert({ listing_id: listingId, reviewer_id: user.id, reviewer_name: name.slice(0, 80), rating, comment: comment.slice(0, 2000) });
                setBusy(false);
                if (error) { toast.error("Couldn't post your review."); return; }
                form.reset();
                toast.success("Thanks — your review is live.");
                qc.invalidateQueries({ queryKey: ["listing", listingId] });
              }}
            >
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} stars`}>
                    <Stars value={i <= rating ? 1 : 0} size={24} className="[&>svg:not(:first-child)]:hidden" />
                  </button>
                ))}
              </div>
              <Input name="rname" placeholder="Your name as shown (e.g. Maria G.)" maxLength={80} />
              <Textarea name="comment" placeholder="How did the job go?" rows={3} maxLength={2000} />
              <Button type="submit" disabled={busy}>Post review</Button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
