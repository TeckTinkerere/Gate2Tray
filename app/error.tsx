"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-4">
      <div className="max-w-md rounded-xl bg-background p-6 text-center shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)]">
        <h1 className="text-xl font-semibold">Gate2Tray needs a moment</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">The local demo could not load. Your SQLite data is still on this computer.</p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
