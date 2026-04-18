import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({
  label,
  className = "",
  id,
  ...props
}: TextareaProps) {
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
      <textarea
        id={id}
        className={`w-full px-3 py-2 bg-ivory border border-border-warm rounded-lg text-near-black placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus transition-colors resize-vertical ${className}`}
        rows={3}
        {...props}
      />
    </div>
  );
}
