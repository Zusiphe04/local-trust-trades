import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserRole } from "@/lib/directory";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — LocalPro" },
      { name: "description", content: "Choose a new password for your LocalPro account." },
      { property: "og:title", content: "Set a new password — LocalPro" },
      { property: "og:description", content: "Choose a new password for your LocalPro account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Set a new password</h1>
      <form
        className="mt-6 space-y-3 rounded-md border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const pw = String(new FormData(e.currentTarget).get("pw"));
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) { toast.error(error.message); return; }
          toast.success("Password updated.");
          const { data } = await supabase.auth.getUser();
          const role = data.user ? await getUserRole(data.user.id) : "customer";
          navigate({ to: role === "provider" ? "/dashboard" : "/search" });
        }}
      >
        <Label htmlFor="pw">New password</Label>
        <Input id="pw" name="pw" type="password" minLength={8} required />
        <Button type="submit" className="w-full" disabled={busy}>Update password</Button>
      </form>
    </div>
  );
}
