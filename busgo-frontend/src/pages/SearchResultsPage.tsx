import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Card, ErrorMessage, Spinner } from '../components/ui';
import { formatDate } from '../lib/dates';
import type { RouteSummary, ServiceType } from '../lib/types';
import { DateStrip } from '../search/DateStrip';
import { useRouteSearch, useStops } from '../search/queries';
import { RouteCard } from '../search/RouteCard';
import { SearchForm } from '../search/SearchForm';
import { dateParam } from '../search/url';

const SERVICE_TYPES: ServiceType[] = [
  'normal',
  'semi_luxury',
  'luxury',
  'super_luxury',
];
const SORTS = {
  departure: (a: RouteSummary, b: RouteSummary) =>
    a.departureTime.localeCompare(b.departureTime),
  price: (a: RouteSummary, b: RouteSummary) => a.price - b.price,
  duration: (a: RouteSummary, b: RouteSummary) =>
    a.durationMinutes - b.durationMinutes,
};
type Sort = keyof typeof SORTS;

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950';

/** /search?from=CMB&to=KDY&date=2026-12-01[&type=luxury&operator=2&sort=price] */
export function SearchResultsPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const from = params.get('from')?.toUpperCase() ?? '';
  const to = params.get('to')?.toUpperCase() ?? '';

  if (!from || !to || from === to) {
    return (
      <Card className="mx-auto max-w-4xl">
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          {t('search.required')}
        </p>
        <SearchForm initial={{ from, to }} />
      </Card>
    );
  }
  return <Results from={from} to={to} />;
}

function Results({ from, to }: { from: string; to: string }) {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(false);
  const date = dateParam(params);
  const typeFilter = params.get('type') as ServiceType | null;
  const operatorFilter = Number(params.get('operator')) || null;
  const sortParam = params.get('sort') ?? '';
  const sort: Sort = Object.hasOwn(SORTS, sortParam)
    ? (sortParam as Sort)
    : 'departure';

  const stops = useStops();
  const search = useRouteSearch({ from, to, date });
  const city = (code: string) =>
    stops.data?.find((s) => s.code === code)?.city ?? code;

  /** Changes some URL params, keeping the rest. Empty values are removed. */
  const update = (changes: Record<string, string | null>) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  };

  const routes = search.data ?? [];
  const operators = [
    ...new Map(routes.map((r) => [r.operator.id, r.operator])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const types = SERVICE_TYPES.filter((type) =>
    routes.some((r) => r.serviceType === type),
  );
  const shown = routes
    .filter((r) => !typeFilter || r.serviceType === typeFilter)
    .filter((r) => !operatorFilter || r.operator.id === operatorFilter)
    .sort(SORTS[sort]);
  const filtered = typeFilter !== null || operatorFilter !== null;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
              {t('search.title', { from: city(from), to: city(to) })}
            </h1>
            <p className="text-sm text-slate-500">
              {formatDate(date, i18n.language, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {search.data &&
                ` · ${t('search.found', { count: shown.length })}`}
            </p>
          </div>
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing((open) => !open)}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 ring-1 ring-slate-300 hover:bg-brand-50 dark:text-brand-200 dark:ring-slate-700 dark:hover:bg-slate-800"
          >
            {t('search.change')}
          </button>
        </div>
        {editing && (
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <SearchForm
              key={`${from}-${to}-${date}`}
              initial={{ from, to, date }}
            />
          </div>
        )}
      </Card>

      <DateStrip value={date} onChange={(d) => update({ date: d })} />

      {search.isPending && <Spinner label={t('search.loading')} />}
      {search.error && <ErrorMessage>{search.error.message}</ErrorMessage>}

      {search.data && routes.length === 0 && (
        <Card className="text-center text-slate-600 dark:text-slate-400">
          {t('search.noBuses')}
        </Card>
      )}

      {routes.length > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div
              role="group"
              aria-label={t('search.busType')}
              className="flex flex-wrap gap-2"
            >
              <FilterChip
                active={!typeFilter}
                onClick={() => update({ type: null })}
              >
                {t('search.allTypes')}
              </FilterChip>
              {types.map((type) => (
                <FilterChip
                  key={type}
                  active={typeFilter === type}
                  onClick={() => update({ type })}
                >
                  {t(`serviceTypes.${type}`)}
                </FilterChip>
              ))}
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('search.operator')}
                <select
                  className={selectClass}
                  value={operatorFilter ?? ''}
                  onChange={(e) => update({ operator: e.target.value })}
                >
                  <option value="">{t('search.allOperators')}</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('search.sort')}
                <select
                  className={selectClass}
                  value={sort}
                  onChange={(e) =>
                    update({
                      sort:
                        e.target.value === 'departure' ? null : e.target.value,
                    })
                  }
                >
                  <option value="departure">{t('search.sortDeparture')}</option>
                  <option value="price">{t('search.sortPrice')}</option>
                  <option value="duration">{t('search.sortDuration')}</option>
                </select>
              </label>
            </div>
          </div>

          {shown.length === 0 ? (
            <Card className="text-center text-slate-600 dark:text-slate-400">
              <p>{t('search.noMatch')}</p>
              {filtered && (
                <button
                  type="button"
                  onClick={() => update({ type: null, operator: null })}
                  className="mt-3 font-semibold text-brand-700 hover:underline dark:text-brand-200"
                >
                  {t('search.clearFilters')}
                </button>
              )}
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {shown.map((route) => (
                <RouteCard key={route.id} route={route} date={date} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-700 text-white'
          : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}
