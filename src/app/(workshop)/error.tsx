"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-xl font-serif font-medium text-near-black">
        Noe gikk galt
      </h2>
      <p className="text-stone text-sm">
        En uventet feil oppstod. Prøv igjen eller kontakt support.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral/90 transition-colors"
      >
        Prøv igjen
      </button>
    </div>
  );
}
