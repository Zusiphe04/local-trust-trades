import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserRole } from "@/lib/directory";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role } = useQuery({ queryKey: ["role", user?.id], queryFn: () => user ? getUserRole(user.id) : Promise.resolve("customer"), enabled: !!user });
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">L</span>
          LocalPro
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/search">Browse pros</Link>
          </Button>
          {(!user || role === "provider") && <Button asChild variant="ghost" size="sm">
            <Link to="/for-pros">For pros</Link>
          </Button>}
          {user ? (
            <>
              {role === "provider" && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await qc.cancelQueries();
                  qc.clear();
                  await supabase.auth.signOut();
                  navigate({ to: "/", replace: true });
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} LocalPro. Real reviews from real customers.</span>
        <span className="flex gap-4">
          <Link to="/search" className="hover:text-foreground">Find a pro</Link>
          <ProviderFooterLink />
        </span>
      </div>
    </footer>
  );
}

function ProviderFooterLink() {
  const { user } = useSession();
  const { data: role } = useQuery({ queryKey: ["role", user?.id], queryFn: () => user ? getUserRole(user.id) : Promise.resolve("customer"), enabled: !!user });
  return !user || role === "provider" ? <Link to="/for-pros" className="hover:text-foreground">List your business</Link> : null;
}
