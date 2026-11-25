import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, ErrorMessage, Spinner } from '../components/ui';
import { dateInSriLanka, formatDate } from '../lib/dates';
import { PAGE_SIZE, useAdminPassengers, useSetUserActive } from './queries';
import type { AdminPassenger } from './types';
import { AdminTable, LinkButton, Pager, StatusBadge } from './ui';
import { useUrlFilters } from './useUrlFilters';

/** /admin/passengers: registered passenger accounts. */
export function PassengersPage() {
  const { t, i18n } = useTranslation();
  const filters = useUrlFilters();
  const search = filters.get('q');
  const [typed, setTyped] = useState(search);
  const passengers = useAdminPassengers(search, filters.page);
  const setActive = useSetUserActive();

  const day = (timestamp: string) =>
    formatDate(dateInSriLanka(timestamp), i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const toggle = (p: AdminPassenger) => {
    if (
      p.isActive &&
      !window.confirm(t('admin.people.confirmDeactivate', { name: p.fullName }))
    ) {
      return;
    }
    setActive.mutate({ id: p.id, isActive: !p.isActive });
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = typed.trim();
    filters.set({ q: term.length >= 2 ? term : '' });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('admin.passengers.title')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('admin.passengers.subtitle')}
          </p>
        </div>
        <form
          onSubmit={submitSearch}
          className="flex items-end gap-2"
          role="search"
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('admin.bookings.search')}
            <input
              type="search"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t('admin.passengers.searchPlaceholder')}
              className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            {t('admin.bookings.find')}
          </button>
        </form>
      </div>

      {setActive.error && (
        <ErrorMessage>{setActive.error.message}</ErrorMessage>
      )}
      {passengers.isPending && <Spinner label={t('common.loading')} />}
      {passengers.error && (
        <ErrorMessage>{passengers.error.message}</ErrorMessage>
      )}
      {passengers.data && passengers.data.items.length === 0 && (
        <Card className="text-center text-slate-600 dark:text-slate-400">
          {t('admin.passengers.none')}
        </Card>
      )}
      {passengers.data && passengers.data.items.length > 0 && (
        <>
          <AdminTable
            head={[
              t('auth.fullName'),
              t('admin.people.contact'),
              t('admin.dashboard.bookings'),
              t('admin.passengers.lastBooked'),
              t('admin.people.joined'),
              t('admin.status.label'),
              '',
            ]}
          >
            {passengers.data.items.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.fullName}</td>
                <td>
                  <span className="break-all">{p.email}</span>
                  {p.phone && (
                    <span className="block text-xs text-slate-500">
                      {p.phone}
                    </span>
                  )}
                </td>
                <td className="tabular-nums">{p.bookings}</td>
                <td className="whitespace-nowrap">
                  {p.lastBookedAt ? day(p.lastBookedAt) : '–'}
                </td>
                <td className="whitespace-nowrap">{day(p.createdAt)}</td>
                <td>
                  <StatusBadge active={p.isActive} />
                </td>
                <td className="text-right">
                  <LinkButton
                    disabled={setActive.isPending}
                    onClick={() => toggle(p)}
                    aria-label={t(
                      p.isActive
                        ? 'admin.deactivateNamed'
                        : 'admin.activateNamed',
                      { name: p.fullName },
                    )}
                  >
                    {p.isActive ? t('admin.deactivate') : t('admin.activate')}
                  </LinkButton>
                </td>
              </tr>
            ))}
          </AdminTable>
          <Pager
            page={passengers.data.page}
            limit={PAGE_SIZE}
            total={passengers.data.total}
            onChange={(page) => filters.set({ page: String(page) })}
          />
        </>
      )}
    </div>
  );
}
