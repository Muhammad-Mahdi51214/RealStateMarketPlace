"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";

const ownerLinks = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/requests", label: "Hire requests" },
  { href: "/vendor/projects", label: "Projects" },
  { href: "/vendor/team", label: "Team" },
  { href: "/vendor/tasks", label: "Tasks" },
  { href: "/vendor/materials", label: "Project materials" },
];

const employeeLinks = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/tasks", label: "My tasks" },
  { href: "/vendor/projects", label: "Projects" },
];

export function VendorNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const links = user?.role === "vendor_employee" ? employeeLinks : ownerLinks;

  return (
    <div>
      <h1 className="text-[28px] font-bold text-primary-navy">Vendor portal</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage hire requests, construction projects, team, and materials.
      </p>
      <nav className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-[#E8F2FF] text-primary-navy"
                  : "text-text-secondary hover:bg-slate-50 hover:text-primary-navy",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
