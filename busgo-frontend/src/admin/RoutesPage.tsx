import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Card, ErrorMessage, Spinner } from '../components/ui';
import { formatLkr } from '../lib/format';
import { ServiceTypeBadge } from '../search/RouteCard';
import { useAdminOperators, useAdminRoutes, useCreateRoute } from './queries';
import { RouteForm } from './RouteForm';
import { AdminTable, StatusBadge } from './ui';

const linkClass =
  'font-semibold text-brand-700 hover:underline dark:text-brand-200';

/** /admin/routes[?operator=2]: every bus service, on sale or not. */
export function RoutesPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const operatorId = Number(params.get('operator')) || null;
  const operators = useAdminOperators();
  const routes = useAdminRoutes(operatorId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('admin.routes.title')}
          </h2>
          <p className="text-sm text-slate-500">{t('admin.routes.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('search.operator')}
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={operatorId ?? ''}
              onChange={(e) =>
                setParams(e.target.value ? { operator: e.target.value } : {}, {
                  replace: true,
                })
              }
            >
              <option value="">{t('search.allOperators')}</option>
              {operators.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <Link
            to="/admin/routes/new"
            className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            {t('admin.routes.add')}
          </Link>
        </div>
      </div>

      {routes.isPending && <Spinner label={t('common.loading')} />}
      {routes.error && <ErrorMessage>{routes.error.message}</ErrorMessage>}
      {routes.data && routes.data.length === 0 && (
        <Card className="text-center text-slate-600 dark:text-slate-400">
          {t('admin.routes.none')}
        </Card>
      )}
      {routes.data && routes.data.length > 0 && (
        <AdminTable
          head={[
            t('admin.dashboard.route'),
            t('admin.routes.times'),
            t('search.busType'),
            t('admin.routes.fare'),
            t('search.operator'),
            t('admin.status.label'),
            '',
          ]}
        >
          {routes.data.map((route) => (
            <tr key={route.id}>
              <td>
                <span className="font-medium">
                  {route.from.city} → {route.to.city}
                </span>
                <span className="block text-xs text-slate-500">
                  {t('route.routeNumber', { number: route.routeNumber })}
                  {route.busNumber && ` · ${route.busNumber}`}
                </span>
              </td>
              <td className="tabular-nums whitespace-nowrap">
                {route.departureTime} – {route.arrivalTime}
              </td>
              <td>
                <ServiceTypeBadge type={route.serviceType} />
              </td>
              <td className="tabular-nums whitespace-nowrap">
                {formatLkr(route.price)}
              </td>
              <td>{route.operator.name}</td>
              <td>
                <StatusBadge active={route.isActive && route.operatorActive} />
                {route.isActive && !route.operatorActive && (
                  <span className="block text-xs text-slate-500">
                    {t('admin.routes.operatorOff')}
                  </span>
                )}
              </td>
              <td className="text-right">
                <Link
                  to={`/admin/routes/${route.id}`}
                  className={linkClass}
                  aria-label={t('admin.routes.manageNamed', {
                    name: `${route.from.city} → ${route.to.city} ${route.departureTime}`,
                  })}
                >
                  {t('admin.routes.manage')}
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

/** /admin/routes/new */
export function NewRoutePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateRoute();
  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/routes" className={`self-start text-sm ${linkClass}`}>
        ← {t('admin.routes.back')}
      </Link>
      <Card>
        <h2 className="mb-4 text-xl font-bold">{t('admin.routes.add')}</h2>
        <RouteForm
          saving={create.isPending}
          error={create.error?.message ?? null}
          submitLabel={t('admin.routes.create')}
          onSubmit={(values) =>
            create.mutate(values, {
              // Next: add the towns where passengers can board.
              onSuccess: (route) =>
                void navigate(`/admin/routes/${route.id}`, { replace: true }),
            })
          }
        />
      </Card>
    </div>
  );
}
