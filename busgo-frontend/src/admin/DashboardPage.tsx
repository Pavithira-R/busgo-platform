import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Card, ErrorMessage, Spinner } from '../components/ui';
import { addDays, formatDate, todayInSriLanka } from '../lib/dates';
import { formatCompact, formatLkr } from '../lib/format';
import { DailyChart, OperatorChart } from './charts';
import { useDashboard } from './queries';

const RANGES = [7, 30, 90] as const;

/** /admin: bookings and revenue for the last 7, 30 or 90 days. */
export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const days = RANGES.find((d) => String(d) === params.get('days')) ?? 30;
  const to = todayInSriLanka();
  const dashboard = useDashboard({ from: addDays(to, -(days - 1)), to });
  const data = dashboard.data;

  const dateLabel = (date: string) =>
    formatDate(date, i18n.language, { day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('admin.dashboard.title')}
        </h2>
        <div
          role="group"
          aria-label={t('admin.dashboard.range')}
          className="flex rounded-lg bg-white p-1 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
        >
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === days}
              onClick={() => setParams({ days: String(d) }, { replace: true })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                d === days
                  ? 'bg-brand-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {t('admin.dashboard.lastDays', { count: d })}
            </button>
          ))}
        </div>
      </div>

      {dashboard.isPending && <Spinner label={t('common.loading')} />}
      {dashboard.error && (
        <ErrorMessage>{dashboard.error.message}</ErrorMessage>
      )}

      {data && (
        <>
          <p className="-mt-3 text-sm text-slate-500">
            {dateLabel(data.range.from)} – {dateLabel(data.range.to)}
          </p>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Card>
              <p className="text-sm text-slate-500">
                {t('admin.dashboard.netRevenue')}
              </p>
              <p className="mt-1 text-5xl font-semibold text-slate-900 dark:text-white">
                {formatLkr(data.revenue.netRevenue)}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {t('admin.dashboard.grossAndRefunds', {
                  gross: formatLkr(data.revenue.grossSales),
                  refunds: formatLkr(data.revenue.refunds),
                })}
              </p>
            </Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatTile
                label={t('admin.dashboard.bookings')}
                value={data.bookings.total}
              />
              <StatTile
                label={t('admin.dashboard.cancelled')}
                value={data.bookings.cancelled}
              />
              <StatTile
                label={t('admin.dashboard.newPassengers')}
                value={data.passengers.newInRange}
                note={t('admin.dashboard.ofTotal', {
                  total: data.passengers.total.toLocaleString('en-LK'),
                })}
              />
              <StatTile
                label={t('admin.dashboard.bookedToday')}
                value={data.today.bookedToday}
              />
              <StatTile
                label={t('admin.dashboard.travellingToday')}
                value={data.today.travellingToday}
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={t('admin.dashboard.dailyBookings')}
              table={
                <DataTable
                  head={[
                    t('admin.dashboard.date'),
                    t('admin.dashboard.bookings'),
                  ]}
                  rows={data.daily.map((d) => [
                    dateLabel(d.date),
                    d.bookings.toLocaleString('en-LK'),
                  ])}
                />
              }
            >
              <DailyChart
                data={data.daily}
                metric="bookings"
                formatValue={(v) =>
                  t('admin.dashboard.bookingsCount', { count: v })
                }
              />
            </ChartCard>
            <ChartCard
              title={t('admin.dashboard.dailyRevenue')}
              table={
                <DataTable
                  head={[
                    t('admin.dashboard.date'),
                    t('admin.dashboard.revenue'),
                  ]}
                  rows={data.daily.map((d) => [
                    dateLabel(d.date),
                    formatLkr(d.revenue),
                  ])}
                />
              }
            >
              <DailyChart
                data={data.daily}
                metric="revenue"
                formatValue={formatLkr}
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={t('admin.dashboard.byOperator')}
              table={
                data.byOperator.length > 0 && (
                  <DataTable
                    head={[
                      t('search.operator'),
                      t('admin.dashboard.bookings'),
                      t('admin.dashboard.revenue'),
                    ]}
                    rows={data.byOperator.map((o) => [
                      o.operator,
                      o.bookings.toLocaleString('en-LK'),
                      formatLkr(o.revenue),
                    ])}
                  />
                )
              }
            >
              {data.byOperator.length === 0 ? (
                <Empty />
              ) : (
                <OperatorChart
                  data={data.byOperator}
                  formatTooltip={(o) =>
                    `${t('admin.dashboard.bookingsCount', { count: o.bookings })} · ${formatLkr(o.revenue)}`
                  }
                />
              )}
            </ChartCard>

            <Card>
              <h3 className="font-semibold">
                {t('admin.dashboard.topRoutes')}
              </h3>
              {data.popularRoutes.length === 0 ? (
                <Empty />
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <DataTable
                    head={[
                      t('admin.dashboard.route'),
                      t('admin.dashboard.bookings'),
                      t('admin.dashboard.revenue'),
                    ]}
                    rows={data.popularRoutes.map((r) => [
                      <span key="route">
                        <span className="font-medium">
                          {r.from} → {r.to}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {r.departureTime} · {r.operator}
                        </span>
                      </span>,
                      r.bookings.toLocaleString('en-LK'),
                      formatLkr(r.revenue),
                    ])}
                  />
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
        {formatCompact(value)}
      </p>
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </Card>
  );
}

/** A chart with its numbers available as a table, for screen readers and checking values. */
function ChartCard({
  title,
  table,
  children,
}: {
  title: string;
  table: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
      {table && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium text-brand-700 dark:text-brand-200">
            {t('admin.dashboard.showTable')}
          </summary>
          <div className="mt-2 max-h-64 overflow-auto">{table}</div>
        </details>
      )}
    </Card>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700">
          {head.map((h, i) => (
            <th
              key={h}
              className={`py-2 font-medium ${i > 0 ? 'text-right' : ''}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr
            key={r}
            className="border-b border-slate-100 last:border-0 dark:border-slate-800"
          >
            {row.map((cell, i) => (
              <td
                key={i}
                className={`py-2 ${i > 0 ? 'text-right tabular-nums' : ''}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty() {
  const { t } = useTranslation();
  return (
    <p className="py-8 text-center text-sm text-slate-500">
      {t('admin.dashboard.empty')}
    </p>
  );
}
