import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export default function Card({
  padded = true,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-on-surface-light/[0.12] bg-on-surface-light/[0.03] dark:border-surface-overlay dark:bg-surface-raised ${padded ? 'p-4' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
