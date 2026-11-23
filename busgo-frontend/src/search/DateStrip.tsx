import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { bookableDates, formatDate, todayInSriLanka } from '../lib/dates';

/** Every bookable day (today + 30) in a row that scrolls sideways. */
export function DateStrip({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const selected = useRef<HTMLButtonElement>(null);
  const today = todayInSriLanka();

  // Keep the chosen day visible, e.g. when opening a search 3 weeks ahead.
  useEffect(() => {
    selected.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [value]);

  return (
    <div
      role="group"
      aria-label={t('search.dates')}
      className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
    >
      {bookableDates().map((date) => {
        const active = date === value;
        return (
          <button
            key={date}
            ref={active ? selected : undefined}
            type="button"
            aria-pressed={active}
            aria-label={formatDate(date, i18n.language, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            onClick={() => onChange(date)}
            className={`flex min-w-16 shrink-0 snap-start flex-col items-center rounded-xl px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-xs">
              {date === today
                ? t('search.today')
                : formatDate(date, i18n.language, { weekday: 'short' })}
            </span>
            <span className="text-lg leading-tight font-bold">
              {formatDate(date, i18n.language, { day: 'numeric' })}
            </span>
            <span className="text-xs">
              {formatDate(date, i18n.language, { month: 'short' })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
