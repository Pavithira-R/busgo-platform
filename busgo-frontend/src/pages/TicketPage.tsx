import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router';
import { CancelBooking } from '../booking/CancelBooking';
import { useTicket } from '../booking/queries';
import { TicketStatusBadge } from '../booking/TicketStatusBadge';
import { Button, ErrorMessage, Spinner } from '../components/ui';
import { ApiError } from '../lib/api';
import { formatDate, hasDeparted } from '../lib/dates';
import { formatLkr } from '../lib/format';
import type { Ticket } from '../lib/types';
import { ServiceTypeBadge } from '../search/RouteCard';

/** /tickets/:ticketId: the e-ticket with its QR code, ready to show or print. */
export function TicketPage() {
  const { t } = useTranslation();
  const ticketId = useParams().ticketId?.toUpperCase() ?? '';
  const justBooked = Boolean(
    (useLocation().state as { justBooked?: boolean } | null)?.justBooked,
  );
  const ticket = useTicket(ticketId);

  if (ticket.isPending) return <Spinner label={t('common.loading')} />;
  if (ticket.error) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorMessage>
          {ticket.error instanceof ApiError &&
          [400, 403, 404].includes(ticket.error.status)
            ? t('ticket.notFound')
            : ticket.error.message}
        </ErrorMessage>
      </div>
    );
  }
  return <TicketView ticket={ticket.data} justBooked={justBooked} />;
}

function TicketView({
  ticket,
  justBooked,
}: {
  ticket: Ticket;
  justBooked: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [justCancelled, setJustCancelled] = useState(false);
  const { route } = ticket;
  const departed = hasDeparted(ticket.travelDate, route.departureTime);
  const details: [string, string][] = [
    [t('ticket.passenger'), ticket.passenger.name],
    [
      t('route.travelDate'),
      formatDate(ticket.travelDate, i18n.language, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    ],
    [t('booking.seatLabel'), ticket.seatNumber],
    [
      t('booking.boardingAt'),
      `${ticket.boarding.name}, ${ticket.boarding.time}`,
    ],
    [
      t('ticket.bus'),
      `${route.busNumber} · ${t('route.routeNumber', { number: route.routeNumber })}`,
    ],
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {justCancelled && ticket.cancellation && (
        <p
          role="status"
          className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200 print:hidden dark:bg-brand-900 dark:text-brand-100 dark:ring-brand-800"
        >
          {t('cancel.done', {
            amount: formatLkr(ticket.cancellation.refundAmount),
          })}
        </p>
      )}
      {justBooked && !justCancelled && (
        <p
          role="status"
          className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200 print:hidden dark:bg-brand-900 dark:text-brand-100 dark:ring-brand-800"
        >
          {t('ticket.confirmed', { email: ticket.passenger.email })}
        </p>
      )}

      <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 print:shadow-none">
        <header className="flex flex-wrap items-center justify-between gap-2 bg-brand-700 px-5 py-4 text-white">
          <div>
            <p className="text-xs text-brand-100">{t('ticket.title')}</p>
            <h1 className="text-xl font-bold">
              {route.from.city} → {route.to.city}
            </h1>
          </div>
          <TicketStatusBadge status={ticket.status} departed={departed} />
        </header>

        <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{route.operator.name}</span>
              <ServiceTypeBadge type={route.serviceType} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div>
                <p className="text-2xl font-bold">{route.departureTime}</p>
                <p className="text-sm text-slate-500">{route.from.name}</p>
              </div>
              <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
              <div className="text-right">
                <p className="text-2xl font-bold">{route.arrivalTime}</p>
                <p className="text-sm text-slate-500">{route.to.name}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {ticket.qrCode && ticket.status === 'confirmed' && (
            <div className="flex flex-col items-center gap-2 sm:border-l sm:border-dashed sm:border-slate-300 sm:pl-6 dark:sm:border-slate-700">
              <img
                src={ticket.qrCode}
                alt={t('ticket.qrAlt', { ticketId: ticket.ticketId })}
                className="size-44 rounded-lg bg-white p-1"
              />
              <p className="max-w-44 text-center text-xs text-slate-500">
                {t('ticket.showQr')}
              </p>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-slate-300 px-5 py-4 text-sm dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500">{t('ticket.ticketId')}</p>
            <p className="font-mono text-lg font-bold tracking-wider">
              {ticket.ticketId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {ticket.paymentMethod
                ? t('ticket.paidWith', {
                    method: t(`booking.methods.${ticket.paymentMethod}`),
                  })
                : t('ticket.totalPaid')}
            </p>
            <p className="text-lg font-bold">{formatLkr(ticket.price.total)}</p>
            {ticket.cancellation && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('ticket.refunded', {
                  amount: formatLkr(ticket.cancellation.refundAmount),
                })}
              </p>
            )}
          </div>
        </footer>
      </article>

      <div className="flex flex-wrap gap-3 print:hidden">
        {ticket.status === 'confirmed' && (
          <Button variant="secondary" onClick={() => window.print()}>
            {t('ticket.print')}
          </Button>
        )}
        <Link
          to="/bookings"
          className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-200"
        >
          {t('nav.myBookings')}
        </Link>
        <Link
          to="/"
          className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-200"
        >
          {t('ticket.bookAnother')}
        </Link>
      </div>

      {ticket.status === 'confirmed' && !departed && (
        <CancelBooking
          ticketId={ticket.ticketId}
          onCancelled={() => setJustCancelled(true)}
        />
      )}
    </div>
  );
}
