import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "purple";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-md",
  secondary: "border border-gray-200 bg-white text-text hover:bg-gray-50",
  ghost: "text-text-light hover:bg-gray-100 hover:text-text",
  danger: "bg-red-600 text-white hover:bg-red-700",
  purple: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm";
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
