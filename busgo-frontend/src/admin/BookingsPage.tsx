import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { TicketStatusBadge } from '../booking/TicketStatusBadge';
import { Card, ErrorMessage, Spinner } from '../components/ui';
import { formatDate, hasDeparted } from '../lib/dates';
import { formatLkr } from '../lib/format';
import type { BookingStatus } from '../lib/types';
import { PAGE_SIZE, useAdminBookings, useAdminOperators } from './queries';
import { AdminTable, Pager } from './ui';
import { useUrlFilters } from './useUrlFilters';

const STATUSES: BookingStatus[] = ['confirmed', 'cancelled', 'used', 'expired'];
const fieldClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950';
const labelClass =
  'flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400';

/** /admin/bookings: every booking, newest first, with filters in the URL. */
export function BookingsPage() {
  const { t, i18n } = useTranslation();
  const filters = useUrlFilters();
  const operators = useAdminOperators();
  const search = filters.get('q');
  const [typed, setTyped] = useState(search);

  const status = filters.get('status') as BookingStatus | '';
  const bookings = useAdminBookings({
    search: search || undefined,
    status: status || undefined,
    travelDate: filters.get('date') || undefined,
    operatorId: Number(filters.get('operator')) || undefined,
    page: filters.page,
  });
  const filtered = [
    search,
    status,
    filters.get('date'),
    filters.get('operator'),
  ].some(Boolean);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    // The server needs at least 2 characters to search.
    const term = typed.trim();
    filters.set({ q: term.length >= 2 ? term : '' });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('admin.bookings.title')}
        </h2>
        <p className="text-sm text-slate-500">{t('admin.bookings.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form
          onSubmit={submitSearch}
          className="flex items-end gap-2"
          role="search"
        >
          <label className={labelClass}>
            {t('admin.bookings.search')}
            <input
              type="search"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t('admin.bookings.searchPlaceholder')}
              className={`${fieldClass} w-64`}
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            {t('admin.bookings.find')}
          </button>
        </form>
        <label className={labelClass}>
          {t('admin.status.label')}
          <select
            className={fieldClass}
            value={status}
            onChange={(e) => filters.set({ status: e.target.value })}
          >
            <option value="">{t('admin.bookings.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`ticket.status.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {t('route.travelDate')}
          <input
            type="date"
            className={fieldClass}
            value={filters.get('date')}
            onChange={(e) => filters.set({ date: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          {t('search.operator')}
          <select
            className={fieldClass}
            value={filters.get('operator')}
            onChange={(e) => filters.set({ operator: e.target.value })}
          >
            <option value="">{t('search.allOperators')}</option>
            {operators.data?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setTyped('');
              filters.set({ q: '', status: '', date: '', operator: '' });
            }}
            className="py-2 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-200"
          >
            {t('search.clearFilters')}
          </button>
        )}
      </div>

      {bookings.isPending && <Spinner label={t('common.loading')} />}
      {bookings.error && <ErrorMessage>{bookings.error.message}</ErrorMessage>}
      {bookings.data && bookings.data.items.length === 0 && (
        <Card className="text-center text-slate-600 dark:text-slate-400">
          {t('admin.bookings.none')}
        </Card>
      )}
      {bookings.data && bookings.data.items.length > 0 && (
        <>
          <AdminTable
            head={[
              t('ticket.ticketId'),
              t('ticket.passenger'),
              t('admin.bookings.trip'),
              t('booking.seatLabel'),
              t('admin.status.label'),
              t('route.total'),
            ]}
          >
            {bookings.data.items.map((b) => (
              <tr key={b.ticketId}>
                <td>
                  <Link
                    to={`/tickets/${b.ticketId}`}
                    state={{ fromAdmin: true }}
                    className="font-mono font-semibold text-brand-700 hover:underline dark:text-brand-200"
                  >
                    {b.ticketId}
                  </Link>
                </td>
                <td>
                  {b.passenger.name}
                  <span className="block text-xs text-slate-500">
                    {b.passenger.phone ?? b.passenger.email}
                  </span>
                </td>
                <td>
                  {b.route.from.city} → {b.route.to.city}
                  <span className="block text-xs text-slate-500">
                    {formatDate(b.travelDate, i18n.language, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {b.route.departureTime} · {b.route.operator.name}
                  </span>
                </td>
                <td className="tabular-nums">{b.seatNumber}</td>
                <td>
                  <TicketStatusBadge
                    status={b.status}
                    departed={hasDeparted(b.travelDate, b.route.departureTime)}
                  />
                </td>
                <td className="tabular-nums whitespace-nowrap">
                  {formatLkr(b.price.total)}
                  {b.cancellation && (
                    <span className="block text-xs text-slate-500">
                      {t('ticket.refunded', {
                        amount: formatLkr(b.cancellation.refundAmount),
                      })}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
          <Pager
            page={bookings.data.page}
            limit={PAGE_SIZE}
            total={bookings.data.total}
            onChange={(page) => filters.set({ page: String(page) })}
          />
        </>
      )}
    </div>
  );
}
