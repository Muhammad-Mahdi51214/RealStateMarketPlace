import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary-navy text-white",
        residential: "bg-plot-residential/15 text-[#9A6400]",
        commercial: "bg-plot-commercial/15 text-plot-commercial",
        available: "bg-accent-green/15 text-accent-green",
        reserved: "bg-status-reserved/20 text-[#8A6800]",
        sold: "bg-status-sold/20 text-status-sold",
        verified: "bg-status-verified/15 text-status-verified",
        muted: "bg-bg-muted text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
