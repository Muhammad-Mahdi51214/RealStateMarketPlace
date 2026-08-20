import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-muted">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-primary-navy via-[#0a3a58] to-primary-teal px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-base p-6 shadow-xl sm:p-8">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
