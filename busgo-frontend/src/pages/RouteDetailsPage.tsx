import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';
import { Card, ErrorMessage, Spinner } from '../components/ui';
import { ApiError } from '../lib/api';
import { formatDate, hasDeparted } from '../lib/dates';
import { formatDuration, formatLkr, SERVICE_FEE } from '../lib/format';
import type { RouteDetails } from '../lib/types';
import { useRouteDetails, useSeatMap } from '../search/queries';
import { ServiceTypeBadge } from '../search/RouteCard';
import { dateParam, searchUrl } from '../search/url';

/** /routes/:id?date=2026-12-01: one bus, its stops, price and refund rules. */
export function RouteDetailsPage() {
  const { t } = useTranslation();
  const id = Number(useParams().id);
  const [params] = useSearchParams();
  const date = dateParam(params);
  const details = useRouteDetails(id);

  if (details.isPending) return <Spinner label={t('common.loading')} />;
  if (details.error) {
    const notFound =
      details.error instanceof ApiError && details.error.status === 404;
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorMessage>
          {notFound ? t('route.notFound') : details.error.message}
        </ErrorMessage>
      </div>
    );
  }
  return <Details route={details.data} date={date} />;
}

function Details({ route, date }: { route: RouteDetails; date: string }) {
  const { t, i18n } = useTranslation();
  const seats = useSeatMap(route.id, date);
  const departed = hasDeparted(date, route.departureTime);
  const backTo = searchUrl({
    from: route.from.code,
    to: route.to.code,
    date,
  });

  const stops = [
    {
      name: route.from.name,
      time: route.departureTime,
      label: t('route.start'),
    },
    ...route.boardingPoints.map((p) => ({
      name: p.name,
      time: p.time,
      label: null,
    })),
    { name: route.to.name, time: route.arrivalTime, label: t('route.end') },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link
        to={backTo}
        className="self-start text-sm font-semibold text-brand-700 hover:underline dark:text-brand-200"
      >
        ← {t('route.back')}
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                {route.operator.name}
              </h1>
              <ServiceTypeBadge type={route.serviceType} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {t(`seatLayouts.${route.serviceType}`)} ·{' '}
              {t('route.routeNumber', { number: route.routeNumber })} ·{' '}
              {t('route.busNumber', { number: route.busNumber })}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div>
                <p className="text-3xl font-bold">{route.departureTime}</p>
                <p className="text-sm text-slate-500">{route.from.city}</p>
              </div>
              <div className="flex flex-1 flex-col items-center text-xs text-slate-500">
                <span>{formatDuration(t, route.durationMinutes)}</span>
                <span className="my-1 h-px w-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{route.arrivalTime}</p>
                <p className="text-sm text-slate-500">{route.to.city}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {t('route.journey')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('route.boardingHint')}
            </p>
            <ol className="mt-4">
              {stops.map((stop, i) => {
                const ends = stop.label !== null;
                return (
                  <li key={`${stop.name}-${i}`} className="flex gap-4">
                    <span className="w-12 shrink-0 pt-0.5 text-right text-sm font-semibold tabular-nums">
                      {stop.time}
                    </span>
                    <span className="relative flex w-3 shrink-0 justify-center">
                      <span
                        className={`relative z-10 mt-1.5 rounded-full ${
                          ends
                            ? 'size-3 bg-brand-700'
                            : 'size-2.5 border-2 border-brand-600 bg-white dark:bg-slate-900'
                        }`}
                      />
                      {i < stops.length - 1 && (
                        <span className="absolute top-3 bottom-0 w-0.5 bg-brand-200 dark:bg-brand-800" />
                      )}
                    </span>
                    <span className="pb-5">
                      <span
                        className={
                          ends
                            ? 'font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
                        }
                      >
                        {stop.name}
                      </span>
                      {stop.label && (
                        <span className="block text-xs text-slate-500">
                          {stop.label}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <p className="text-sm text-slate-500">{t('route.travelDate')}</p>
            <p className="font-semibold">
              {formatDate(date, i18n.language, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {departed ? (
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {t('search.departed')}
              </p>
            ) : (
              seats.data && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {seats.data.availableSeats === 0
                    ? t('search.soldOut')
                    : t('route.seatsFree', {
                        available: seats.data.availableSeats,
                        total: seats.data.totalSeats,
                      })}
                </p>
              )
            )}

            <h2 className="mt-5 font-semibold">{t('route.price')}</h2>
            <dl className="mt-2 flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">
                  {t('route.fare')}
                </dt>
                <dd>{formatLkr(route.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">
                  {t('route.serviceFee')}
                </dt>
                <dd>{formatLkr(SERVICE_FEE)}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700">
                <dt>{t('route.total')}</dt>
                <dd className="text-brand-800 dark:text-brand-200">
                  {formatLkr(route.price + SERVICE_FEE)}
                </dd>
              </div>
            </dl>
            {!departed && seats.data && seats.data.availableSeats > 0 && (
              <Link
                to={`/book/${route.id}?date=${date}`}
                className="mt-5 flex w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
              >
                {t('route.chooseSeat')}
              </Link>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold">{t('route.refundTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t('route.refundIntro')}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
              <li>{t('route.refundOver7Days')}</li>
              <li>{t('route.refund3To7Days')}</li>
              <li>{t('route.refund1To3Days')}</li>
              <li>{t('route.refundUnder24Hours')}</li>
              <li>{t('route.refundAfter')}</li>
            </ul>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t('route.refundOperator')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
