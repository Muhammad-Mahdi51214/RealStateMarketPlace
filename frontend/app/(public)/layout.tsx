import { PublicChrome } from "@/components/shared/public-chrome";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicChrome>{children}</PublicChrome>;
}
