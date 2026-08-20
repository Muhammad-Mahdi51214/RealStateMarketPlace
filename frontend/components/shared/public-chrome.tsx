"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBanner } from "@/components/shared/announcement-banner";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBrowse =
    pathname.startsWith("/inventory") || pathname === "/buy-property";
  const isLanding = pathname === "/";

  return (
    <>
      {!isBrowse && !isLanding ? <AnnouncementBanner /> : null}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
