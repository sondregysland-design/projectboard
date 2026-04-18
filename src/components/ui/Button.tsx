import React from "react";

type ButtonVariant = "primary" | "secondary" | "dark" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-terracotta text-ivory hover:bg-terracotta/90 shadow-[0px_0px_0px_1px_#c96442]",
  secondary:
    "bg-warm-sand text-charcoal hover:bg-border-warm shadow-[0px_0px_0px_1px_#d1cfc5]",
  dark: "bg-dark-surface text-ivory hover:bg-near-black shadow-[0px_0px_0px_1px_#30302e]",
  ghost: "text-olive hover:bg-warm-sand/50 hover:text-near-black",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
