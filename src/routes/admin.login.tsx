import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [
    { title: "Administrator sign in — LocalPro" },
    { name: "description", content: "Secure LocalPro administrator sign-in." },
    { property: "og:title", content: "Administrator sign in — LocalPro" },
    { property: "og:description", content: "Secure sign-in for LocalPro administrators." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function checkAdmin(userId: string) {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (error || data?.role !== "admin") {
      toast.error("This account does not have administrator access.");
      return false;
    }
    await navigate({ to: "/admin/dashboard", replace: true });
    return true;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-md border bg-accent text-primary"><ShieldCheck className="h-6 w-6" /></span>
        <div><p className="text-xs font-semibold uppercase text-primary">LocalPro administration</p><h1 className="text-2xl font-bold">Administrator sign in</h1></div>
      </div>
      <form className="space-y-4 rounded-md border bg-card p-6" onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true);
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") });
          if (error) throw error;
          if (data.user) await checkAdmin(data.user.id);
        } catch {
          toast.error("Sign-in failed. Check your account details and try again.");
        } finally {
          setBusy(false);
        }
      }}>
        <div className="space-y-2"><Label htmlFor="admin-email">Email</Label><Input id="admin-email" name="email" type="email" autoComplete="username" required /></div>
        <div className="space-y-2"><Label htmlFor="admin-password">Password</Label><Input id="admin-password" name="password" type="password" autoComplete="current-password" required /></div>
        <Button className="w-full" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">Administrator access is restricted to authorised LocalPro accounts.</p>
    </div>
  );
}