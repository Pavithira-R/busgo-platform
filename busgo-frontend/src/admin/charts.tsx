import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDate } from '../lib/dates';
import { formatCompact } from '../lib/format';

// One series per chart, in teal-600: it passes the colour checks on both the
// white and the dark card. Text uses slate tokens, never the series colour.
const SERIES = '#0d9488';
const THEMES = {
  light: { grid: '#e2e8f0', axis: '#64748b', surface: '#ffffff' },
  dark: { grid: '#1e293b', axis: '#94a3b8', surface: '#0f172a' },
};

const darkQuery = '(prefers-color-scheme: dark)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(darkQuery);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}
/** Chart colours follow the light/dark setting, like the rest of the page. */
function useChartTheme() {
  const dark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(darkQuery).matches ?? false,
  );
  return THEMES[dark ? 'dark' : 'light'];
}

function TooltipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <p className="text-slate-500">{title}</p>
      <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
        <span
          className="size-2 rounded-full"
          style={{ background: SERIES }}
          aria-hidden="true"
        />
        {value}
      </p>
    </div>
  );
}

/**
 * Bookings (columns) or revenue (area) per day. A chart reads one measure;
 * the two never share a chart, so each has a single honest axis.
 */
export function DailyChart({
  data,
  metric,
  formatValue,
}: {
  data: { date: string; bookings: number; revenue: number }[];
  metric: 'bookings' | 'revenue';
  formatValue: (value: number) => string;
}) {
  const { i18n } = useTranslation();
  const theme = useChartTheme();
  const label = (date: string) =>
    formatDate(date, i18n.language, { day: 'numeric', month: 'short' });

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={theme.grid} />
      <XAxis
        dataKey="date"
        tickFormatter={label}
        tick={{ fill: theme.axis, fontSize: 12 }}
        axisLine={{ stroke: theme.grid }}
        tickLine={false}
        minTickGap={24}
      />
      <YAxis
        allowDecimals={false}
        tickFormatter={formatCompact}
        tick={{ fill: theme.axis, fontSize: 12 }}
        axisLine={false}
        tickLine={false}
        width={48}
      />
      <Tooltip
        cursor={{ stroke: theme.axis, strokeWidth: 1, fill: theme.grid }}
        content={({ active, payload }) =>
          active && payload?.[0] ? (
            <TooltipBox
              title={formatDate(
                payload[0].payload.date as string,
                i18n.language,
                { weekday: 'short', day: 'numeric', month: 'short' },
              )}
              value={formatValue(Number(payload[0].value))}
            />
          ) : null
        }
      />
    </>
  );

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        {metric === 'bookings' ? (
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0 }}>
            {axes}
            <Bar
              dataKey="bookings"
              fill={SERIES}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        ) : (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0 }}>
            {axes}
            <Area
              dataKey="revenue"
              type="monotone"
              stroke={SERIES}
              strokeWidth={2}
              fill={SERIES}
              fillOpacity={0.1}
              activeDot={{
                r: 5,
                fill: SERIES,
                stroke: theme.surface,
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** Bookings per operator as horizontal bars, value at each bar's tip. */
export function OperatorChart({
  data,
  formatTooltip,
}: {
  data: { operator: string; bookings: number; revenue: number }[];
  formatTooltip: (row: { bookings: number; revenue: number }) => string;
}) {
  const theme = useChartTheme();
  return (
    <div style={{ height: Math.max(120, data.length * 44) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="operator"
            width={150}
            tick={{ fill: theme.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: theme.grid }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <TooltipBox
                  title={String(payload[0].payload.operator)}
                  value={formatTooltip(payload[0].payload)}
                />
              ) : null
            }
          />
          <Bar
            dataKey="bookings"
            fill={SERIES}
            barSize={16}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="bookings"
              position="right"
              fill={theme.axis}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
