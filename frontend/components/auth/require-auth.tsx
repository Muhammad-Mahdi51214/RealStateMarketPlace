"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

/** Redirects to login when session is missing or API auth no longer matches cookies. */
export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<"vendor" | "vendor_employee" | "customer" | "super_admin" | "sales_admin" | "verification_officer">;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/login");
    }
  }, [loading, user, roles, router, pathname]);

  if (loading) {
    return (
      <p className="text-sm text-text-secondary">Checking your session…</p>
    );
  }

  if (!user) {
    return (
      <p className="text-sm text-text-secondary">Redirecting to login…</p>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
