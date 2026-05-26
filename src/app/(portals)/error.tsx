"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    /loading chunk|chunkloaderror|failed to fetch dynamically imported module/i.test(
      error.message
    )
  );
}

export default function PortalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reloading, setReloading] = useState(false);
  const chunkError = isChunkLoadError(error);

  useEffect(() => {
    if (!chunkError) return;
    const key = `sms-chunk-reload:${window.location.pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setReloading(true);
    window.location.reload();
  }, [chunkError]);

  if (chunkError && reloading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-600">Refreshing page after a dev build update…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <h1 className="text-xl font-semibold text-slate-900">
        {chunkError ? "Page update required" : "Something went wrong"}
      </h1>
      <p className="max-w-md text-sm text-slate-600">
        {chunkError
          ? "The app was rebuilt while this tab was open (common in local dev). Reload to fetch the latest code."
          : error.message || "An unexpected error occurred."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => window.location.reload()}>
          Reload page
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()}>
          Try again
        </Button>
      </div>
      {chunkError && (
        <p className="max-w-md text-xs text-slate-500">
          If this keeps happening, stop all <code className="text-slate-700">npm run dev</code>{" "}
          processes, run <code className="text-slate-700">npm run dev:clean</code>, then hard-refresh
          the browser (Ctrl+Shift+R).
        </p>
      )}
    </div>
  );
}
