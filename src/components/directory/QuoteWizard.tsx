import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Q = { key: string; label: string; options?: string[]; kind?: "text" | "photo"; optional?: boolean };

function categoryQuestions(category: string): Q[] {
  if (category === "Plumbing")
    return [
      { key: "Job Type", label: "What's the job?", options: ["Leak", "Installation", "Clog", "Other"] },
      { key: "Urgency", label: "How soon do you need it?", options: ["Emergency", "Within 24h", "Flexible"] },
      { key: "Property", label: "Property type", options: ["Home", "Commercial"] },
    ];
  if (category === "Electrical" || category === "Handyman")
    return [
      { key: "Task", label: "What do you need done?", kind: "text" },
      { key: "Budget", label: "Estimated budget", options: ["Under $100", "$100–$500", "$500–$1,000", "$1,000+", "Not sure"] },
      { key: "photo", label: "Add a photo of the job (optional)", kind: "photo", optional: true },
    ];
  return [];
}

const GENERAL: Q[] = [
  { key: "Best Time", label: "Best time to reach you", options: ["Morning", "Afternoon", "Evening"] },
  { key: "Preferred Contact", label: "How should they contact you?", options: ["Call", "Text", "Email"] },
];

export function QuoteWizard({ open, onOpenChange, listingId, category, businessName }: {
  open: boolean; onOpenChange: (o: boolean) => void; listingId: string; category: string; businessName: string;
}) {
  const steps: Q[][] = [...categoryQuestions(category).map((q) => [q]), GENERAL, []]; // last = contact details
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [c, setC] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const isLast = step === steps.length - 1;
  const current = steps[step]!;

  const stepDone = current.every((q) => q.optional || (q.kind === "photo" ? true : (answers[q.key] ?? "").trim().length > 0));

  const reset = () => { setStep(0); setAnswers({}); setPhoto(null); setC({ name: "", email: "", phone: "", message: "" }); setSent(false); };

  async function submit(): Promise<unknown> {
    const name = c.name.trim(), email = c.email.trim(), phone = c.phone.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return toast.error("Add your name and a valid email.");
    if ((answers["Preferred Contact"] === "Call" || answers["Preferred Contact"] === "Text") && !/^[+\d][\d\s().-]{6,}$/.test(phone))
      return toast.error("Add a phone number so they can call or text you.");
    setBusy(true);
    let photo_path: string | null = null;
    if (photo) {
      const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
      if (photo.size > 8e6 || !["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext)) {
        setBusy(false); return toast.error("Photo must be a JPG, PNG or WebP under 8 MB.");
      }
      photo_path = `inquiries/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("listing-media").upload(photo_path, photo, { contentType: photo.type });
      if (error) { setBusy(false); return toast.error("Photo upload failed — try again or skip the photo."); }
    }
    const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.trim().slice(0, 300)]).filter(([, v]) => v));
    const summary = Object.entries(clean).map(([k, v]) => `${k}: ${v}`).join(" | ");
    const { error } = await supabase.from("inquiries").insert({
      listing_id: listingId,
      customer_name: name.slice(0, 100),
      customer_email: email.slice(0, 255),
      customer_phone: phone.slice(0, 40) || null,
      message: (c.message.trim() || summary || "Quote request").slice(0, 2000),
      answers: clean,
      photo_path,
    });
    setBusy(false);
    if (error) toast.error("Couldn't send — please try again.");
    else setSent(true);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o && sent) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Get a quote from {businessName}</DialogTitle>
          <DialogDescription>{sent ? "Request sent." : `Step ${step + 1} of ${steps.length} · takes under a minute`}</DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Sent! {businessName} will get back to you by your preferred method.</p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
            {isLast ? (
              <div className="space-y-3">
                <div><Label htmlFor="qw-name">Your name</Label><Input id="qw-name" maxLength={100} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></div>
                <div><Label htmlFor="qw-email">Email</Label><Input id="qw-email" type="email" maxLength={255} value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /></div>
                <div><Label htmlFor="qw-phone">Phone {answers["Preferred Contact"] === "Email" ? "(optional)" : ""}</Label><Input id="qw-phone" type="tel" maxLength={40} value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></div>
                <div><Label htmlFor="qw-msg">Anything else? (optional)</Label><Textarea id="qw-msg" rows={3} maxLength={2000} value={c.message} onChange={(e) => setC({ ...c, message: e.target.value })} /></div>
              </div>
            ) : (
              current.map((q) => (
                <div key={q.key} className="space-y-2">
                  <Label>{q.label}</Label>
                  {q.options ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {q.options.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.key]: o })}
                          className={cn("rounded-md border px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary",
                            answers[q.key] === o && "border-primary bg-primary/10 text-primary")}
                        >{o}</button>
                      ))}
                    </div>
                  ) : q.kind === "photo" ? (
                    <div className="space-y-2">
                      <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                      {photo && <img src={URL.createObjectURL(photo)} alt="Job preview" className="h-32 rounded-md border object-cover" />}
                    </div>
                  ) : (
                    <Textarea rows={3} maxLength={300} value={answers[q.key] ?? ""} placeholder="e.g. Install 3 ceiling lights in the living room"
                      onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} />
                  )}
                </div>
              ))
            )}
            <div className="flex justify-between gap-2">
              <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Back</Button>
              {isLast ? (
                <Button onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send request"}</Button>
              ) : (
                <Button onClick={() => setStep(step + 1)} disabled={!stepDone}>
                  {current[0]?.kind === "photo" && !photo ? "Skip" : "Next"}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
