import { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import type { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/**
 * A labelled input with hint and error text, wired up for screen readers.
 * Errors from the form are translation keys (see lib/validation.ts).
 */
export function TextField({
  label,
  hint,
  error,
  ref,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: FieldError;
  ref?: React.Ref<HTMLInputElement>;
}) {
  const { t } = useTranslation();
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        className={`rounded-lg border bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 ${
          error
            ? 'border-red-500'
            : 'border-slate-300 focus:border-brand-600 dark:border-slate-700'
        }`}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error?.message && (
        <p
          id={errorId}
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {t(error.message)}
        </p>
      )}
    </div>
  );
}

/** A centred card with a heading, used by the login and sign-up pages. */
export function FormCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {subtitle}
        </p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}
