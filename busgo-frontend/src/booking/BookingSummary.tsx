import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui';
import { formatDate } from '../lib/dates';
import { formatLkr, SERVICE_FEE } from '../lib/format';
import type { BoardingPoint, RouteDetails } from '../lib/types';
import { ServiceTypeBadge } from '../search/RouteCard';

/** The trip being booked and what it costs, shown beside every step. */
export function BookingSummary({
  route,
  date,
  seat,
  boardingPoint,
}: {
  route: RouteDetails;
  date: string;
  seat: string | null;
  /** null = the starting bus stand. */
  boardingPoint: BoardingPoint | null;
}) {
  const { t, i18n } = useTranslation();
  const rows: [string, string][] = [
    [
      t('route.travelDate'),
      formatDate(date, i18n.language, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    ],
    [
      t('booking.boardingAt'),
      boardingPoint
        ? `${boardingPoint.name}, ${boardingPoint.time}`
        : `${route.from.name}, ${route.departureTime}`,
    ],
    [t('booking.seatLabel'), seat ?? '–'],
  ];

  return (
    <Card>
      <h2 className="font-semibold">{t('booking.summary')}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-medium">{route.operator.name}</span>
        <ServiceTypeBadge type={route.serviceType} />
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {route.from.city} {route.departureTime} → {route.to.city}{' '}
        {route.arrivalTime}
      </p>
      <dl className="mt-4 flex flex-col gap-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
          <dt className="text-slate-500">{t('route.fare')}</dt>
          <dd>{formatLkr(route.price)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">{t('route.serviceFee')}</dt>
          <dd>{formatLkr(SERVICE_FEE)}</dd>
        </div>
        <div className="flex justify-between text-base font-bold">
          <dt>{t('route.total')}</dt>
          <dd className="text-brand-800 dark:text-brand-200">
            {formatLkr(route.price + SERVICE_FEE)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
