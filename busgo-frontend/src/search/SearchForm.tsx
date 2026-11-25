import { type FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, ErrorMessage } from '../components/ui';
import { lastBookableDate, todayInSriLanka } from '../lib/dates';
import { useStops } from './queries';
import { searchUrl } from './url';

const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-brand-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const labelClass = 'text-sm font-medium text-slate-700 dark:text-slate-300';

/** From / To / date form. Searching opens the results page. */
export function SearchForm({
  initial,
}: {
  initial?: { from?: string; to?: string; date?: string };
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stops = useStops();
  const id = useId();
  const [from, setFrom] = useState(initial?.from ?? '');
  const [to, setTo] = useState(initial?.to ?? '');
  const [date, setDate] = useState(initial?.date ?? todayInSriLanka());
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!from || !to) return setError(t('search.required'));
    if (from === to) return setError(t('search.sameStops'));
    setError(null);
    void navigate(searchUrl({ from, to, date }));
  };
  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const options = (
    <>
      <option value="">{t('search.chooseCity')}</option>
      {stops.data?.map((stop) => (
        <option key={stop.code} value={stop.code}>
          {stop.city}
        </option>
      ))}
    </>
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {(error || stops.error) && (
        <ErrorMessage>{error ?? stops.error?.message}</ErrorMessage>
      )}
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_1fr_auto] md:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-from`} className={labelClass}>
            {t('search.from')}
          </label>
          <select
            id={`${id}-from`}
            className={fieldClass}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {options}
          </select>
        </div>
        <button
          type="button"
          onClick={swap}
          aria-label={t('search.swap')}
          title={t('search.swap')}
          className="self-center justify-self-center rounded-full p-2.5 text-brand-700 ring-1 ring-slate-300 hover:bg-brand-50 md:self-end dark:text-brand-200 dark:ring-slate-700 dark:hover:bg-slate-800"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5 rotate-90 md:rotate-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
          </svg>
        </button>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-to`} className={labelClass}>
            {t('search.to')}
          </label>
          <select
            id={`${id}-to`}
            className={fieldClass}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {options}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-date`} className={labelClass}>
            {t('search.date')}
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className={fieldClass}
            value={date}
            min={todayInSriLanka()}
            max={lastBookableDate()}
            required
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full md:w-auto md:px-6">
          {t('search.submit')}
        </Button>
      </div>
    </form>
  );
}
