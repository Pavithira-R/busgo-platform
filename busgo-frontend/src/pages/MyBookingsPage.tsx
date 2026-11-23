import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useMyBookings } from '../booking/queries';
import { TicketStatusBadge } from '../booking/TicketStatusBadge';
import { Card, ErrorMessage, Spinner } from '../components/ui';
import { formatDate, hasDeparted } from '../lib/dates';
import { formatLkr } from '../lib/format';
import type { Ticket } from '../lib/types';

/** Confirmed trips that haven't left yet. Everything else is history. */
function isUpcoming(ticket: Ticket) {
  return (
    ticket.status === 'confirmed' &&
    !hasDeparted(ticket.travelDate, ticket.route.departureTime)
  );
}

const byDeparture = (a: Ticket, b: Ticket) =>
  `${a.travelDate} ${a.route.departureTime}`.localeCompare(
    `${b.travelDate} ${b.route.departureTime}`,
  );

/** /bookings: upcoming trips first (soonest at the top), then past ones. */
export function MyBookingsPage() {
  const { t } = useTranslation();
  const bookings = useMyBookings();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  if (bookings.isPending) return <Spinner label={t('common.loading')} />;
  if (bookings.error) {
    return <ErrorMessage>{bookings.error.message}</ErrorMessage>;
  }

  const upcoming = bookings.data.filter(isUpcoming).sort(byDeparture);
  const past = bookings.data
    .filter((b) => !isUpcoming(b))
    .sort((a, b) => byDeparture(b, a));
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {t('myBookings.title')}
      </h1>

      <div
        role="tablist"
        aria-label={t('myBookings.title')}
        className="flex gap-2"
      >
        {(['upcoming', 'past'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === key
                ? 'bg-brand-700 text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
            }`}
          >
            {t(`myBookings.${key}`, {
              count: key === 'upcoming' ? upcoming.length : past.length,
            })}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="text-center text-slate-600 dark:text-slate-400">
          <p>
            {tab === 'upcoming'
              ? t('myBookings.noUpcoming')
              : t('myBookings.noPast')}
          </p>
          <Link
            to="/"
            className="mt-3 inline-block font-semibold text-brand-700 hover:underline dark:text-brand-200"
          >
            {t('nav.search')}
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((ticket) => (
            <li key={ticket.ticketId}>
              <BookingRow ticket={ticket} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookingRow({ ticket }: { ticket: Ticket }) {
  const { t, i18n } = useTranslation();
  const { route } = ticket;
  return (
    <Link
      to={`/tickets/${ticket.ticketId}`}
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-brand-500 dark:bg-slate-900 dark:ring-slate-800"
    >
      <div className="w-16 shrink-0 text-center">
        <p className="text-xs text-slate-500 uppercase">
          {formatDate(ticket.travelDate, i18n.language, { month: 'short' })}
        </p>
        <p className="text-2xl leading-tight font-bold">
          {formatDate(ticket.travelDate, i18n.language, { day: 'numeric' })}
        </p>
        <p className="text-xs text-slate-500">
          {formatDate(ticket.travelDate, i18n.language, { weekday: 'short' })}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {route.from.city} → {route.to.city}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {route.departureTime} · {route.operator.name} ·{' '}
          {t('myBookings.seat', { seat: ticket.seatNumber })}
        </p>
        <p className="font-mono text-xs text-slate-500">{ticket.ticketId}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <TicketStatusBadge
          status={ticket.status}
          departed={hasDeparted(ticket.travelDate, route.departureTime)}
        />
        <span className="text-sm font-semibold">
          {formatLkr(ticket.price.total)}
        </span>
      </div>
    </Link>
  );
}
