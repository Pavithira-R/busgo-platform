import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ErrorMessage } from '../components/ui';
import { useSaveBoardingPoints } from './queries';
import type { AdminRouteDetails } from './types';

interface Row {
  key: number;
  /** Set for points that already exist (bookings may refer to them). */
  id?: number;
  name: string;
  minutes: string;
}

/** "06:00" + 95 minutes = "07:35" (wrapping past midnight). */
function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

let nextKey = 1;

/**
 * Towns between the start and end stands, in travel order, each with the
 * minutes after departure the bus gets there.
 */
export function BoardingPointsEditor({ route }: { route: AdminRouteDetails }) {
  const { t } = useTranslation();
  const save = useSaveBoardingPoints(route.id);
  const [rows, setRows] = useState<Row[]>(() =>
    route.boardingPoints.map((p) => ({
      key: nextKey++,
      id: p.id,
      name: p.name,
      minutes: String(p.minutesFromStart),
    })),
  );
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);

  const change = (key: number, field: 'name' | 'minutes', value: string) => {
    setRows((all) =>
      all.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
    setSaved(false);
  };
  const move = (index: number, by: -1 | 1) => {
    setRows((all) => {
      const next = [...all];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
    setSaved(false);
  };
  const remove = (key: number) => {
    setRows((all) => all.filter((r) => r.key !== key));
    setSaved(false);
  };
  const add = () => {
    setRows((all) => [...all, { key: nextKey++, name: '', minutes: '' }]);
    setSaved(false);
  };

  /** Same rules as the server, checked here so mistakes show per row. */
  const validate = () => {
    const found: Record<number, string> = {};
    let previous = 0;
    for (const row of rows) {
      const minutes = Number(row.minutes);
      if (row.name.trim().length < 2) found[row.key] = 'errors.nameMin';
      else if (!Number.isInteger(minutes) || minutes <= 0)
        found[row.key] = 'admin.boarding.minutesInvalid';
      else if (minutes <= previous) found[row.key] = 'admin.boarding.order';
      else if (minutes >= route.durationMinutes)
        found[row.key] = 'admin.boarding.afterArrival';
      if (Number.isInteger(minutes)) previous = Math.max(previous, minutes);
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    save.mutate(
      rows.map((r) => ({
        id: r.id,
        name: r.name.trim(),
        minutesFromStart: Number(r.minutes),
      })),
      { onSuccess: () => setSaved(true) },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold">{t('admin.boarding.title')}</h3>
        <p className="text-sm text-slate-500">
          {t('admin.boarding.hint', { minutes: route.durationMinutes })}
        </p>
      </div>
      {save.error && <ErrorMessage>{save.error.message}</ErrorMessage>}
      {saved && (
        <p
          role="status"
          className="text-sm font-medium text-brand-700 dark:text-brand-200"
        >
          {t('admin.boarding.saved')}
        </p>
      )}

      <p className="text-sm">
        <span className="font-semibold tabular-nums">
          {route.departureTime}
        </span>{' '}
        {route.from.name}
      </p>
      <ol className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const minutes = Number(row.minutes);
          const error = errors[row.key];
          return (
            <li key={row.key} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-12 text-sm font-semibold tabular-nums text-slate-500">
                  {Number.isInteger(minutes) && minutes > 0
                    ? addMinutes(route.departureTime, minutes)
                    : '–'}
                </span>
                <input
                  aria-label={t('admin.boarding.town', { number: i + 1 })}
                  aria-invalid={!!error}
                  value={row.name}
                  onChange={(e) => change(row.key, 'name', e.target.value)}
                  placeholder={t('admin.boarding.townPlaceholder')}
                  className="min-w-40 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <input
                  aria-label={t('admin.boarding.minutes', { number: i + 1 })}
                  aria-invalid={!!error}
                  type="number"
                  min={1}
                  value={row.minutes}
                  onChange={(e) => change(row.key, 'minutes', e.target.value)}
                  className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <span className="text-xs text-slate-500">
                  {t('admin.boarding.minAfter')}
                </span>
                <span className="flex gap-1">
                  <IconButton
                    label={t('admin.boarding.up', { number: i + 1 })}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    label={t('admin.boarding.down', { number: i + 1 })}
                    disabled={i === rows.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    label={t('admin.boarding.remove', { number: i + 1 })}
                    onClick={() => remove(row.key)}
                  >
                    ✕
                  </IconButton>
                </span>
              </div>
              {error && (
                <p className="text-xs font-medium text-red-600 sm:pl-14 dark:text-red-400">
                  {t(error, { minutes: route.durationMinutes })}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-sm">
        <span className="font-semibold tabular-nums">{route.arrivalTime}</span>{' '}
        {route.to.name}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={add}>
          {t('admin.boarding.add')}
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {t('admin.boarding.save')}
        </Button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-md text-slate-600 ring-1 ring-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
      {...props}
    >
      {children}
    </button>
  );
}
