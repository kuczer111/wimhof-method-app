"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-sky-500 text-white active:bg-sky-600 disabled:bg-sky-500/40",
  secondary:
    "bg-gray-200 text-gray-800 active:bg-gray-300 disabled:bg-gray-200/40 dark:bg-gray-800 dark:text-gray-100 dark:active:bg-gray-700 dark:disabled:bg-gray-800/40",
  danger:
    "bg-red-500 text-white active:bg-red-600 disabled:bg-red-500/40",
  ghost:
    "bg-transparent text-gray-600 active:bg-gray-100 disabled:text-gray-400 dark:text-gray-300 dark:active:bg-gray-800 dark:disabled:text-gray-600",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
