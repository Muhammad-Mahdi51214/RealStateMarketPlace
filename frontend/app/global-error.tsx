"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h2 className="text-xl font-semibold">Application error</h2>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#0B2A4A] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
