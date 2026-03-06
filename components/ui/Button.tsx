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
    "bg-brand text-white active:bg-brand-dark disabled:bg-brand/40",
  secondary:
    "bg-on-surface-light/10 text-on-surface-light active:bg-on-surface-light/15 disabled:bg-on-surface-light/5 dark:bg-surface-overlay dark:text-on-surface dark:active:bg-on-surface-faint dark:disabled:bg-surface-overlay/40",
  danger:
    "bg-danger text-white active:bg-danger-dark disabled:bg-danger/40",
  ghost:
    "bg-transparent text-on-surface-light-muted active:bg-on-surface-light/[0.06] disabled:text-on-surface-muted dark:text-on-surface-muted dark:active:bg-surface-overlay dark:disabled:text-on-surface-faint",
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
        className={`inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-base disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
