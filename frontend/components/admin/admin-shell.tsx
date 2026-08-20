"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@shared/types/database.types";

type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
};

const links: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    roles: ["verification_officer", "sales_admin", "super_admin"],
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    roles: ["sales_admin", "super_admin"],
  },
  {
    href: "/admin/listings-review",
    label: "Listings",
    roles: ["verification_officer", "super_admin"],
  },
  {
    href: "/admin/kyc-verification",
    label: "KYC / Docs",
    roles: ["verification_officer", "super_admin"],
  },
  {
    href: "/admin/payment-verified",
    label: "Payment verified",
    roles: ["sales_admin", "verification_officer", "super_admin"],
  },
  {
    href: "/admin/reservations",
    label: "Reservations",
    roles: ["sales_admin", "super_admin"],
  },
  {
    href: "/admin/sales-confirmation",
    label: "Sale confirm",
    roles: ["super_admin"],
  },
  {
    href: "/admin/payments",
    label: "Payments",
    roles: ["sales_admin", "super_admin"],
  },
  {
    href: "/admin/users",
    label: "Users",
    roles: ["super_admin"],
  },
  {
    href: "/admin/vendors",
    label: "Vendors",
    roles: ["sales_admin", "super_admin"],
  },
  {
    href: "/admin/audit-log",
    label: "Audit log",
    roles: ["super_admin"],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin, loading } = useAuth();

  const visibleLinks = useMemo(() => {
    if (!user) return [];
    return links.filter((l) => l.roles.includes(user.role));
  }, [user]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || (user && !isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        Checking admin access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-muted">
      <header className="border-b border-border bg-primary-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm font-bold tracking-wide">CSC Admin Portal</p>
            <p className="text-xs text-white/70">
              {user?.full_name} · {user?.role.replaceAll("_", " ")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/">Public site</Link>
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void logout()}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row sm:px-6">
        <nav className="flex gap-2 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-visible">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
                pathname === link.href
                  ? "bg-primary-teal text-white"
                  : "bg-bg-base text-text-secondary hover:text-primary-navy",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1 rounded-xl border border-border bg-bg-base p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
