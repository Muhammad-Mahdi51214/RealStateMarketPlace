"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-primary-navy">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-text-secondary">
        Please try again. If the problem continues, refresh the page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
