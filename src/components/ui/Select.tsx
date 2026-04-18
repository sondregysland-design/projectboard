import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
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
      <select
        id={id}
        className={`w-full px-3 py-2 bg-ivory border border-border-warm rounded-lg text-near-black focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus transition-colors ${className}`}
        {...props}
      >
        <option value="">Velg...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
