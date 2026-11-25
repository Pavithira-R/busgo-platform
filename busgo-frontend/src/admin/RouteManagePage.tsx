import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { Button, Card, ErrorMessage, Spinner } from '../components/ui';
import { ApiError } from '../lib/api';
import { ServiceTypeBadge } from '../search/RouteCard';
import { BoardingPointsEditor } from './BoardingPointsEditor';
import { CancelTripForm } from './CancelTripForm';
import { useAdminRoute, useUpdateRoute } from './queries';
import { RouteForm } from './RouteForm';
import type { AdminRouteDetails } from './types';
import { StatusBadge } from './ui';

const linkClass =
  'font-semibold text-brand-700 hover:underline dark:text-brand-200';

/** /admin/routes/:id: edit a route, its boarding towns, or cancel a day's trip. */
export function RouteManagePage() {
  const { t } = useTranslation();
  const id = Number(useParams().id);
  const route = useAdminRoute(id);

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/routes" className={`self-start text-sm ${linkClass}`}>
        ← {t('admin.routes.back')}
      </Link>
      {route.isPending && <Spinner label={t('common.loading')} />}
      {route.error && (
        <ErrorMessage>
          {route.error instanceof ApiError && route.error.status === 404
            ? t('route.notFound')
            : route.error.message}
        </ErrorMessage>
      )}
      {route.data && <ManageRoute route={route.data} />}
    </div>
  );
}

function ManageRoute({ route }: { route: AdminRouteDetails }) {
  const { t } = useTranslation();
  const update = useUpdateRoute(route.id);
  const [savedDetails, setSavedDetails] = useState(false);
  const onSale = route.isActive && route.operatorActive;

  const setActive = (isActive: boolean) => {
    if (!isActive && !window.confirm(t('admin.routes.confirmStop'))) return;
    update.mutate({ isActive });
  };

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {route.from.city} → {route.to.city}
              </h2>
              <ServiceTypeBadge type={route.serviceType} />
              <StatusBadge active={onSale} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {route.departureTime} – {route.arrivalTime} ·{' '}
              {route.operator.name} ·{' '}
              {t('route.routeNumber', { number: route.routeNumber })}
            </p>
            <p className="mt-2 text-sm">
              {t('admin.routes.upcoming', { count: route.upcomingBookings })}
            </p>
            {!route.operatorActive && (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {t('admin.routes.operatorOffLong')}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {route.isActive ? (
              <Button
                variant="secondary"
                disabled={update.isPending}
                onClick={() => setActive(false)}
              >
                {t('admin.routes.stopSelling')}
              </Button>
            ) : (
              <Button
                disabled={update.isPending}
                onClick={() => setActive(true)}
              >
                {t('admin.routes.startSelling')}
              </Button>
            )}
            {onSale && (
              <Link
                to={`/routes/${route.id}`}
                className={`text-sm ${linkClass}`}
              >
                {t('admin.routes.viewAsPassenger')}
              </Link>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">{t('admin.routes.details')}</h3>
        {savedDetails && !update.isPending && !update.error && (
          <p
            role="status"
            className="mb-3 text-sm font-medium text-brand-700 dark:text-brand-200"
          >
            {t('admin.routes.saved')}
          </p>
        )}
        <RouteForm
          route={route}
          saving={update.isPending}
          error={update.error?.message ?? null}
          submitLabel={t('admin.save')}
          onSubmit={({ fromCode: _from, toCode: _to, busNumber, ...values }) =>
            update.mutate(
              // A cleared bus number is saved as "none".
              { ...values, busNumber: busNumber ?? null },
              { onSuccess: () => setSavedDetails(true) },
            )
          }
        />
      </Card>

      <Card>
        <BoardingPointsEditor key={route.id} route={route} />
      </Card>

      <Card>
        <CancelTripForm routeId={route.id} />
      </Card>
    </>
  );
}
