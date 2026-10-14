import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ provider: z.boolean().optional(), mode: z.enum(["signin", "signup"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — LocalPro" },
      { name: "description", content: "Sign in or create a LocalPro account to review pros or manage your business listing." },
      { property: "og:title", content: "Sign in — LocalPro" },
      { property: "og:description", content: "Sign in or create your LocalPro account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? (search.provider ? "signup" : "signin"));
  const [role, setRole] = useState<"customer" | "provider">(search.provider ? "provider" : "customer");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const next = role === "provider" ? "/onboarding" : "/";

  useEffect(() => {
    if (role === "provider") sessionStorage.setItem("lp_next", "/onboarding");
    else sessionStorage.removeItem("lp_next");
  }, [role]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password") ?? "");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Check your email for a reset link.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + next, data: { role } },
        });
        if (error) throw error;
        setCheckEmail(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const dest = sessionStorage.getItem("lp_next");
        sessionStorage.removeItem("lp_next");
        navigate({ to: dest === "/onboarding" ? "/onboarding" : "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error("Google sign-in failed"); return; }
    if (r.redirected) return;
    const dest = sessionStorage.getItem("lp_next");
    sessionStorage.removeItem("lp_next");
    navigate({ to: dest === "/onboarding" ? "/onboarding" : "/dashboard" });
  }

  if (checkEmail)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <p className="mt-2 text-muted-foreground">We sent a confirmation link. Click it to finish creating your account.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">
        {mode === "signup" ? (role === "provider" ? "List your business" : "Create your account") : mode === "forgot" ? "Reset your password" : "Welcome back"}
      </h1>
      {mode === "signup" && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {(["customer", "provider"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-md border p-3 text-left text-sm ${role === r ? "border-primary bg-accent" : "bg-card"}`}
            >
              <span className="block font-semibold">{r === "customer" ? "I need a pro" : "I'm a pro"}</span>
              <span className="text-muted-foreground">{r === "customer" ? "Browse, review, contact" : "Get listed, get leads"}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-6 rounded-md border bg-card p-6">
        {mode !== "forgot" && (
          <>
            <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          </>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          {mode !== "forgot" && (
            <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" minLength={8} required /></div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          {mode === "signin" ? (
            <>
              <button className="text-primary" onClick={() => setMode("signup")}>Create an account</button>
              <button className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>
            </>
          ) : (
            <button className="text-primary" onClick={() => setMode("signin")}>I already have an account</button>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Own a business? <Link to="/for-pros" className="text-primary">See plans for pros</Link>
      </p>
    </div>
  );
}
