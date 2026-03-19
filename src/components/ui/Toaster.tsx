"use client";

import { useEffect, useState } from "react";

interface ToastMessage {
  id: number;
  text: string;
}

let toastId = 0;
const listeners: ((msg: ToastMessage) => void)[] = [];

export function showToast(text: string) {
  const msg = { id: ++toastId, text };
  listeners.forEach((fn) => fn(msg));
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 3000);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-slide-up rounded-lg border border-gray-100 bg-white px-5 py-3 text-sm font-medium text-text shadow-lg flex items-center gap-2"
        >
          <svg
            className="h-4 w-4 text-primary flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3.01"
            />
          </svg>
          {t.text}
        </div>
      ))}
    </div>
  );
}
