import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Small shared building blocks so every page looks the same. */

const buttonStyles = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-slate-400 dark:disabled:bg-slate-700',
  secondary:
    'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-400',
} as const;

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-slate-500"
    >
      <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="whitespace-pre-line rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
    >
      {children}
    </div>
  );
}
