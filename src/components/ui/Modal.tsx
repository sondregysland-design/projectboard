"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-near-black/40" onClick={onClose} />
      <div className="relative bg-ivory border border-border-cream rounded-xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] w-full sm:max-w-lg mx-2 sm:mx-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-cream">
          <h2 className="text-lg font-serif font-medium text-near-black">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-stone hover:text-near-black hover:bg-warm-sand/50 transition-colors"
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
