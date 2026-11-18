"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js Error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertCircle size={32} />
      </div>
      <h2 className="mt-4 text-xl font-extrabold text-ink">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-ink-mute">
        {error?.message || "An unexpected error occurred."}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => reset()} className="gap-2">
          <RotateCcw size={16} /> Try again
        </Button>
        <Button variant="secondary" onClick={() => window.location.href = "/student"}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
