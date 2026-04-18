import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-charcoal mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3 py-2 bg-ivory border border-border-warm rounded-lg text-near-black placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
