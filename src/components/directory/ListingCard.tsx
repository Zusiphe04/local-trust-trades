import { Link } from "@tanstack/react-router";
import { MapPin, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stars, VerifiedBadge } from "./Stars";
import { initials, trackEvent, type Listing } from "@/lib/directory";
import { cn } from "@/lib/utils";

export function ListingCard({ listing, featured }: { listing: Listing; featured?: boolean }) {
  const isPro = listing.is_verified;
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-md border bg-card p-5 sm:flex-row",
        featured && "border-primary/40 shadow-[0_1px_0_0_var(--primary)]",
      )}
    >
      <Link to="/pro/$id" params={{ id: listing.id }} className="shrink-0">
        {listing.logo_url ? (
          <img src={listing.logo_url} alt={listing.business_name} className="h-20 w-20 rounded-md border object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-accent font-display text-xl font-semibold text-accent-foreground">
            {initials(listing.business_name)}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/pro/$id" params={{ id: listing.id }} className="font-display text-lg font-semibold hover:text-primary">
            {listing.business_name}
          </Link>
          {isPro && <VerifiedBadge />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Stars value={Number(listing.rating)} size={14} />
            <span className="font-medium text-foreground">{Number(listing.rating).toFixed(1)}</span>
            <span>({listing.review_count})</span>
          </span>
          <span className="rounded-sm border px-1.5 py-0.5 text-xs font-medium text-foreground">{listing.category}</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {listing.service_area}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{listing.bio}</p>
      </div>
      <div className="flex shrink-0 flex-row gap-2 sm:w-40 sm:flex-col">
        {listing.phone && (
          <Button asChild className="flex-1 sm:flex-none">
            <a href={`tel:${listing.phone}`} onClick={() => trackEvent(listing.id, "phone_click")}>
              <Phone className="h-4 w-4" /> Call
            </a>
          </Button>
        )}
        <Button asChild variant="outline" className="flex-1 sm:flex-none">
          <Link to="/pro/$id" params={{ id: listing.id }} hash="inquiry">
            <MessageSquare className="h-4 w-4" /> Get a quote
          </Link>
        </Button>
      </div>
    </article>
  );
}
