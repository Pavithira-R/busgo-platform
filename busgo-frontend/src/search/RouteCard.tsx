import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { hasDeparted } from '../lib/dates';
import { formatDuration, formatLkr } from '../lib/format';
import type { RouteSummary, ServiceType } from '../lib/types';
import { routeUrl } from './url';

const badgeStyles: Record<ServiceType, string> = {
  normal: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  semi_luxury: 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  luxury: 'bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-100',
  super_luxury:
    'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
};

export function ServiceTypeBadge({ type }: { type: ServiceType }) {
  const { t } = useTranslation();
  return (
    <span
      title={t(`seatLayouts.${type}`)}
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles[type]}`}
    >
      {t(`serviceTypes.${type}`)}
    </span>
  );
}

/** One bus in the search results. */
export function RouteCard({
  route,
  date,
}: {
  route: RouteSummary;
  date: string;
}) {
  const { t } = useTranslation();
  const departed = hasDeparted(date, route.departureTime);
  const seats = route.availableSeats ?? route.totalSeats;

  return (
    <article
      aria-label={`${route.operator.name} ${route.departureTime}`}
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${
        departed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {route.operator.name}
        </h2>
        <ServiceTypeBadge type={route.serviceType} />
        <span className="text-xs text-slate-500">
          {t('route.routeNumber', { number: route.routeNumber })}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-2xl font-bold">{route.departureTime}</p>
              <p className="text-sm text-slate-500">{route.from.city}</p>
            </div>
            <div className="flex flex-1 flex-col items-center text-xs text-slate-500">
              <span>{formatDuration(t, route.durationMinutes)}</span>
              <span className="my-1 h-px w-full max-w-40 bg-slate-300 dark:bg-slate-700" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{route.arrivalTime}</p>
              <p className="text-sm text-slate-500">{route.to.city}</p>
            </div>
          </div>
          {route.via.length > 0 && (
            <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
              {t('search.via', { towns: route.via.join(', ') })}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0 dark:border-slate-800">
          <div className="sm:text-right">
            <p className="text-xl font-bold text-brand-800 dark:text-brand-200">
              {formatLkr(route.price)}
            </p>
            <p className="text-xs text-slate-500">{t('search.perSeat')}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <SeatsLeft departed={departed} seats={seats} />
            <Link
              to={routeUrl(route.id, date)}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              {t('search.details')}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function SeatsLeft({ departed, seats }: { departed: boolean; seats: number }) {
  const { t } = useTranslation();
  if (departed) {
    return (
      <span className="text-sm font-semibold text-slate-500">
        {t('search.departed')}
      </span>
    );
  }
  if (seats === 0) {
    return (
      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
        {t('search.soldOut')}
      </span>
    );
  }
  return (
    <span
      className={`text-sm font-medium ${
        seats <= 5
          ? 'text-amber-700 dark:text-amber-300'
          : 'text-slate-600 dark:text-slate-400'
      }`}
    >
      {t('search.seatsLeft', { count: seats })}
    </span>
  );
}
