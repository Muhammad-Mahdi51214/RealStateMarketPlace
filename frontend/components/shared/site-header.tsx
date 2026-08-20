"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  HandCoins,
  HardHat,
  Home,
  LayoutGrid,
  Map,
  Menu,
  Package,
  X,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";

type NavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin, isVendor, ownsProperty, loading } = useAuth();
  const isBrowseSurface =
    pathname.startsWith("/inventory") || pathname === "/buy-property";
  const isLanding = pathname === "/";

  const links: NavLink[] = [
    {
      href: "/inventory",
      label: "CSC Owned Inventory",
      icon: LayoutGrid,
      match: (p) => p.startsWith("/inventory"),
    },
    {
      href: "/buy-property",
      label: "Buy property",
      icon: Home,
      match: (p) => p === "/buy-property",
    },
    {
      href: "/sell-property",
      label: "Sell property",
      icon: HandCoins,
      match: (p) => p.startsWith("/sell-property"),
    },
    {
      href: "/town-plan",
      label: "Town Plan",
      icon: Map,
      match: (p) => p.startsWith("/town-plan"),
    },
    ...(user && !isVendor
      ? [
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: Building2,
            match: (p: string) => p.startsWith("/dashboard"),
          },
          ...(ownsProperty
            ? [
                {
                  href: "/my-property",
                  label: "My Property",
                  icon: Home,
                  match: (p: string) => p.startsWith("/my-property"),
                },
                {
                  href: "/seek-vendor",
                  label: "Seek a vendor",
                  icon: HardHat,
                  match: (p: string) => p.startsWith("/seek-vendor"),
                },
                {
                  href: "/materials",
                  label: "Materials",
                  icon: Package,
                  match: (p: string) => p.startsWith("/materials"),
                },
              ]
            : []),
        ]
      : []),
    ...(isVendor
      ? [
          {
            href: "/vendor/dashboard",
            label: "Vendor dashboard",
            icon: Building2,
            match: (p: string) => p.startsWith("/vendor/dashboard"),
          },
          {
            href: "/vendor/projects",
            label: "Projects",
            icon: HardHat,
            match: (p: string) => p.startsWith("/vendor/projects"),
          },
          {
            href: "/vendor/team",
            label: "Team",
            icon: LayoutGrid,
            match: (p: string) => p.startsWith("/vendor/team"),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/admin/dashboard",
            label: "Admin",
            icon: Building2,
            match: (p: string) => p.startsWith("/admin"),
          },
        ]
      : []),
  ];

  const isActive = (link: NavLink) =>
    link.match ? link.match(pathname) : pathname === link.href;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        isLanding
          ? "border-white/15 bg-primary-navy/75 shadow-[0_8px_28px_rgba(0,26,77,0.28)]"
          : "border-border/80 bg-white/95",
        isBrowseSurface && !isLanding && "shadow-[0_1px_0_rgba(15,23,42,0.04)]",
      )}
    >
      <div className="mx-auto flex h-[4.75rem] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3"
          aria-label="Real State Market Place"
        >
          <span
            className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14",
              isLanding
                ? "bg-white shadow-[0_6px_18px_rgba(0,0,0,0.25)] ring-2 ring-white/90"
                : "bg-white shadow-sm ring-1 ring-[#001a4d]/15",
            )}
          >
            <Image
              src="/images/csc-logo.png"
              alt=""
              width={56}
              height={56}
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
              priority
            />
          </span>
          <span className="leading-[1.15]">
            <span
              className={cn(
                "block text-[15px] font-extrabold tracking-[0.04em] sm:text-[16px]",
                isLanding ? "text-white" : "text-primary-navy",
              )}
            >
              REAL STATE
            </span>
            <span
              className={cn(
                "block text-[11px] font-bold tracking-[0.22em] sm:text-[12px]",
                isLanding ? "text-[#8FD99A]" : "text-[#0A6E4F]",
              )}
            >
              MARKET PLACE
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const Icon = link.icon;
            const showActive = isActive(link);

            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={cn(
                  "group relative flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all",
                  isLanding
                    ? showActive
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                    : showActive
                      ? "bg-[#E8F2FF] text-primary-navy shadow-sm"
                      : "text-primary-navy/80 hover:bg-slate-50 hover:text-primary-navy",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isLanding
                      ? showActive
                        ? "text-white"
                        : "text-white/80"
                      : showActive
                        ? "text-primary-navy"
                        : "text-primary-navy/70",
                  )}
                />
                <span>{link.label}</span>
                {showActive ? (
                  <span
                    className={cn(
                      "absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                      isLanding ? "bg-[#8FD99A]" : "bg-primary-navy",
                    )}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          {loading ? (
            <span
              className={cn(
                "text-xs",
                isLanding ? "text-white/70" : "text-text-secondary",
              )}
            >
              …
            </span>
          ) : user ? (
            <>
              <span
                className={cn(
                  "hidden max-w-[160px] truncate text-sm font-medium xl:inline",
                  isLanding ? "text-white" : "text-primary-navy",
                )}
              >
                {user.full_name}
              </span>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  isLanding && "text-white hover:bg-white/10 hover:text-white",
                )}
              >
                <Link href="/profile">Profile</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void logout()}
                className={cn(
                  isLanding &&
                    "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 rounded-xl px-5 text-[13px] font-semibold shadow-none",
                  isLanding
                    ? "border-white/45 bg-transparent text-white hover:bg-white/10"
                    : "border-slate-200 text-slate-800 hover:border-primary-navy/30 hover:bg-slate-50",
                )}
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className={cn(
                  "h-10 rounded-xl px-5 text-[13px] font-bold",
                  isLanding
                    ? "bg-white text-primary-navy shadow-[0_6px_16px_rgba(0,0,0,0.22)] hover:bg-white/95"
                    : "bg-primary-navy text-white shadow-[0_6px_16px_rgba(0,26,77,0.22)] hover:bg-[#002966]",
                )}
              >
                <Link href="/register">Register Now</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className={cn(
            "rounded-xl p-2 lg:hidden",
            isLanding
              ? "text-white hover:bg-white/10"
              : "text-primary-navy hover:bg-slate-50",
          )}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          className={cn(
            "border-t px-4 py-4 lg:hidden",
            isLanding
              ? "border-white/15 bg-primary-navy/95"
              : "border-border bg-white",
          )}
        >
          <div className="flex flex-col gap-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              const showActive = isActive(link);
              return (
                <Link
                  key={`${link.href}-${link.label}-m`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold",
                    isLanding
                      ? showActive
                        ? "bg-white/15 text-white"
                        : "text-white/90 hover:bg-white/10"
                      : showActive
                        ? "bg-[#E8F2FF] text-primary-navy"
                        : "text-text-primary hover:bg-slate-50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            {!user ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  asChild
                  variant="outline"
                  className={cn(
                    "rounded-xl",
                    isLanding &&
                      "border-white/40 bg-transparent text-white hover:bg-white/10",
                  )}
                >
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button
                  asChild
                  className={cn(
                    "rounded-xl",
                    isLanding
                      ? "bg-white text-primary-navy hover:bg-white/95"
                      : "bg-primary-navy",
                  )}
                >
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Register Now
                  </Link>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className={cn(
                  "mt-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold",
                  isLanding
                    ? "text-white hover:bg-white/10"
                    : "text-text-primary hover:bg-slate-50",
                )}
                onClick={() => void logout()}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
