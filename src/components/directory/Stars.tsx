import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-star text-star" : "fill-border text-border"}
        />
      ))}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm bg-verified px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-verified-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden>
        <path d="M8 0l2 2.2 3-.4.4 3L16 8l-2.6 3.2-.4 3-3-.4L8 16l-2-2.2-3 .4-.4-3L0 8l2.6-3.2.4-3 3 .4z" />
        <path d="M6.8 10.6L4.6 8.4l.9-.9 1.3 1.3 3.7-3.7.9.9z" fill="var(--verified)" />
      </svg>
      Verified Pro
    </span>
  );
}
