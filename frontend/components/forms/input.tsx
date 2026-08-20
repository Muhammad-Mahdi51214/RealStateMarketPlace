import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-teal",
        className,
      )}
      {...props}
    />
  );
}
