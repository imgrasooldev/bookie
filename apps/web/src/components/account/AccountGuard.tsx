"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

/** Client-side safety net (middleware already blocks server-side). Redirects to
 *  /login if there's no session once auth has hydrated. */
export function AccountGuard({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Loading your account…
      </div>
    );
  }
  return <>{children}</>;
}
