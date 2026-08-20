import { AnnouncementBanner } from "@/components/shared/announcement-banner";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { VendorNav } from "@/components/vendor/vendor-nav";
import { RequireAuth } from "@/components/auth/require-auth";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBanner />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <RequireAuth roles={["vendor", "vendor_employee"]}>
          <VendorNav />
          <div className="mt-6">{children}</div>
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
