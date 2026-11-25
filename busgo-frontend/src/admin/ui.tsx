import { type ReactNode, type SelectHTMLAttributes, useId } from 'react';
import { useTranslation } from 'react-i18next';

/** Building blocks shared by the admin pages. */

export function StatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active
          ? 'bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-100'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {active ? t('admin.status.active') : t('admin.status.inactive')}
    </span>
  );
}

/** A card-styled table that scrolls sideways on small screens. */
export function AdminTable({
  head,
  children,
}: {
  head: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-slate-100 [&>tr:last-child]:border-0 dark:[&>tr]:border-slate-800 [&_td]:px-4 [&_td]:py-3">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function SelectField({
  label,
  error,
  children,
  ref,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  ref?: React.Ref<HTMLSelectElement>;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <select
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`rounded-lg border bg-white px-3 py-2.5 text-base text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p
          id={`${id}-error`}
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {t(error)}
        </p>
      )}
    </div>
  );
}

/** Small text-style button used inside tables. */
export function LinkButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      type="button"
      className="font-semibold text-brand-700 hover:underline disabled:opacity-50 dark:text-brand-200"
      {...props}
    />
  );
}

/** "21-40 of 135" with Previous / Next buttons. */
export function Pager({
  page,
  limit,
  total,
  onChange,
}: {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (total === 0) return null;
  const last = Math.max(1, Math.ceil(total / limit));
  return (
    <nav
      aria-label={t('admin.pager.label')}
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-slate-600 dark:text-slate-400">
        {t('admin.pager.showing', {
          from: (page - 1) * limit + 1,
          to: Math.min(page * limit, total),
          total,
        })}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg px-3 py-1.5 font-medium ring-1 ring-slate-300 hover:bg-white disabled:opacity-40 dark:ring-slate-700 dark:hover:bg-slate-900"
        >
          {t('admin.pager.previous')}
        </button>
        <button
          type="button"
          disabled={page >= last}
          onClick={() => onChange(page + 1)}
          className="rounded-lg px-3 py-1.5 font-medium ring-1 ring-slate-300 hover:bg-white disabled:opacity-40 dark:ring-slate-700 dark:hover:bg-slate-900"
        >
          {t('admin.pager.next')}
        </button>
      </div>
    </nav>
  );
}
