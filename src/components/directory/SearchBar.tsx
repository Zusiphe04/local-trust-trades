import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar({ initialQ, initialLoc, compact }: { initialQ?: string | undefined; initialLoc?: string | undefined; compact?: boolean }) {
  const [q, setQ] = useState(initialQ ?? "");
  const [loc, setLoc] = useState(initialLoc ?? "");
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/search", search: { q: q.trim() || undefined, loc: loc.trim() || undefined } });
      }}
      className={`flex w-full flex-col overflow-hidden rounded-md border bg-card shadow-sm sm:flex-row ${compact ? "" : "sm:h-16"}`}
    >
      <label className="flex flex-1 items-center gap-3 border-b px-4 py-3 sm:border-b-0 sm:border-r">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What service do you need?"
          aria-label="Service"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>
      <label className="flex items-center gap-3 px-4 py-3 sm:w-64">
        <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          placeholder="City or ZIP code"
          aria-label="Location"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>
      <Button type="submit" className="m-2 h-auto rounded-sm px-6 text-base">
        Find pros
      </Button>
    </form>
  );
}
