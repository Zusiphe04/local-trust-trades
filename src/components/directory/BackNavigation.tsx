import { useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackNavigation() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return null;
  return <div className="mx-auto max-w-6xl px-4 pt-4"><Button variant="ghost" size="sm" onClick={() => {
    if (router.history.canGoBack()) router.history.back();
    else void router.navigate({ to: "/" });
  }}><ArrowLeft className="h-4 w-4" /> Back</Button></div>;
}