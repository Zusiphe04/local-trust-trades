import { useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type VerificationStatus = "incomplete" | "pending" | "approved" | "rejected";

export function VerificationUpload({ userId, listingId, status, identityPath, businessPath, onSaved }: {
  userId: string;
  listingId: string;
  status: VerificationStatus;
  identityPath: string | null;
  businessPath: string | null;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState<"identity" | "business" | null>(null);

  async function upload(kind: "identity" | "business", file: File | undefined) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "png", "jpg", "jpeg"].includes(extension)) {
      toast.error("Choose a PDF, PNG or JPG document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Documents must be smaller than 10 MB.");
      return;
    }
    setBusy(kind);
    const path = `${userId}/verification/${kind}/${crypto.randomUUID()}.${extension}`;
    try {
      const { error: uploadError } = await supabase.storage.from("listing-media").upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const updateResult = kind === "identity"
        ? await supabase.from("listings").update({ verification_identity_path: path }).eq("id", listingId)
        : await supabase.from("listings").update({ verification_business_path: path }).eq("id", listingId);
      const { error } = updateResult;
      if (error) throw error;
      toast.success("Document submitted for verification.");
      onSaved();
    } catch {
      toast.error("Could not upload the document. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const statusText: Record<VerificationStatus, string> = {
    incomplete: "Documents needed",
    pending: "Under review",
    approved: "Approved",
    rejected: "Needs new documents",
  };

  return (
    <section className="space-y-5 rounded-md border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold"><FileCheck2 className="h-5 w-5 text-primary" /> Business verification</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Submit an identity document and business registration document for review. Files are kept private.</p>
        </div>
        <span className="rounded-sm border px-2 py-1 text-xs font-medium">{statusText[status]}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ["identity", "Identity document", identityPath],
          ["business", "Business registration", businessPath],
        ] as const).map(([kind, label, path]) => (
          <div key={kind} className="space-y-3 border-t pt-4">
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-muted-foreground">{path ? "Document received" : "No document submitted"}</p>
            </div>
            <label className="inline-flex cursor-pointer">
              <input className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" disabled={busy !== null} onChange={(event) => { void upload(kind, event.target.files?.[0]); event.currentTarget.value = ""; }} />
              <span className="pointer-events-none"><Button type="button" variant="outline" disabled={busy !== null}>
                <Upload className="h-4 w-4" /> {busy === kind ? "Uploading…" : path ? "Replace document" : "Upload document"}
              </Button></span>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}