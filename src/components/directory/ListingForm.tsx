import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, uploadMedia, type Listing } from "@/lib/directory";

export type ListingInput = {
  business_name: string;
  category: string;
  bio: string;
  phone: string;
  email: string;
  website_url: string;
  social_url: string;
  service_area: string;
  hours: string;
  logo_url: string | null;
  cover_url: string | null;
};

const url = (v: string) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v);

export function ListingForm({
  userId,
  initial,
  isPro,
  submitLabel,
  onSubmit,
}: {
  userId: string;
  initial?: Partial<Listing>;
  isPro: boolean;
  submitLabel: string;
  onSubmit: (v: ListingInput) => Promise<void>;
}) {
  const [category, setCategory] = useState(initial?.category ?? "");
  const [logo, setLogo] = useState<string | null>(initial?.logo_url ?? null);
  const [cover, setCover] = useState<string | null>(initial?.cover_url ?? null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined, set: (u: string) => void) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image."); return; }
    try {
      set(await uploadMedia(userId, file));
    } catch {
      toast.error("Upload failed. Try a smaller image.");
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const g = (k: string) => String(f.get(k) ?? "").trim();
        const v: ListingInput = {
          business_name: g("business_name").slice(0, 120),
          category,
          bio: g("bio").slice(0, 3000),
          phone: g("phone").slice(0, 40),
          email: g("email").slice(0, 255),
          website_url: url(g("website_url")).slice(0, 300),
          social_url: url(g("social_url")).slice(0, 300),
          service_area: g("service_area").slice(0, 120),
          hours: g("hours").slice(0, 120),
          logo_url: logo,
          cover_url: cover,
        };
        if (!v.business_name || !v.category || !v.phone || !v.service_area) {
          { toast.error("Business name, category, phone and area served are required."); return; }
        }
        setBusy(true);
        try {
          await onSubmit(v);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label htmlFor="business_name">Business name *</Label><Input id="business_name" name="business_name" defaultValue={initial?.business_name} maxLength={120} /></div>
        <div>
          <Label>Primary category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="service_area">Area served (city + postal code) *</Label><Input id="service_area" name="service_area" placeholder="Cape Town, 8001" maxLength={120} defaultValue={initial?.service_area} /></div>
        <div className="sm:col-span-2"><Label htmlFor="bio">About your business</Label><Textarea id="bio" name="bio" rows={5} defaultValue={initial?.bio} placeholder="What you do, how long you've done it, and why customers pick you." /></div>
        <div><Label htmlFor="phone">Phone *</Label><Input id="phone" name="phone" type="tel" placeholder="+27 82 123 4567" maxLength={40} defaultValue={initial?.phone ?? ""} /></div>
        <div><Label htmlFor="hours">Operating hours</Label><Input id="hours" name="hours" defaultValue={initial?.hours ?? "Mon–Fri 8:00–18:00"} /></div>
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-1 text-sm font-semibold">Pro contact links {!isPro && <span className="font-normal text-muted-foreground">— shown on your listing with Pro</span>}</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} /></div>
          <div><Label htmlFor="website_url">Website</Label><Input id="website_url" name="website_url" disabled={!isPro} defaultValue={initial?.website_url ?? ""} /></div>
          <div><Label htmlFor="social_url">Social media</Label><Input id="social_url" name="social_url" disabled={!isPro} defaultValue={initial?.social_url ?? ""} /></div>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Logo</Label>
          <div className="mt-1 flex items-center gap-3">
            {logo ? <img src={logo} alt="" className="h-16 w-16 rounded-md border object-cover" /> : <div className="h-16 w-16 rounded-md border bg-muted" />}
            <Input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0], setLogo)} />
          </div>
        </div>
        <div>
          <Label>Cover photo</Label>
          <div className="mt-1 flex items-center gap-3">
            {cover ? <img src={cover} alt="" className="h-16 w-28 rounded-md border object-cover" /> : <div className="h-16 w-28 rounded-md border bg-muted" />}
            <Input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0], setCover)} />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
