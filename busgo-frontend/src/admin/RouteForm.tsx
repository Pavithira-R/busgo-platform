import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TextField } from '../components/form';
import { Button, ErrorMessage } from '../components/ui';
import type { ServiceType } from '../lib/types';
import { useStops } from '../search/queries';
import { useAdminOperators } from './queries';
import type { AdminRouteDetails, NewRouteInput } from './types';
import { SelectField } from './ui';

const SERVICE_TYPES: ServiceType[] = [
  'normal',
  'semi_luxury',
  'luxury',
  'super_luxury',
];
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'errors.time');

const schema = z
  .object({
    routeNumber: z.string().trim().min(1, 'errors.required').max(20),
    // Form fields hold text; numbers are converted after checking.
    operatorId: z.string().min(1, 'errors.required').transform(Number),
    fromCode: z.string(),
    toCode: z.string(),
    departureTime: time,
    arrivalTime: time,
    price: z
      .string()
      .refine((v) => Number(v) > 0 && Number(v) <= 100_000, 'errors.price')
      .transform(Number),
    serviceType: z.enum(['normal', 'semi_luxury', 'luxury', 'super_luxury']),
    busNumber: z.string().trim().toUpperCase().max(20),
  })
  .refine((r) => r.departureTime !== r.arrivalTime, {
    message: 'errors.sameTimes',
    path: ['arrivalTime'],
  });
// New routes also choose their stops. Checked as a separate part so a
// same-stops mistake shows even while other fields have errors.
const stopsSchema = z
  .object({
    fromCode: z.string().min(1, 'errors.required'),
    toCode: z.string().min(1, 'errors.required'),
  })
  .refine((r) => r.fromCode !== r.toCode, {
    message: 'search.sameStops',
    path: ['toCode'],
  });
const newRouteSchema = schema.and(stopsSchema);
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

/**
 * Route fields. When adding a route the start and end stops are chosen too;
 * after that they are fixed (passengers have booked those towns).
 */
export function RouteForm({
  route,
  saving,
  error,
  submitLabel,
  onSubmit,
}: {
  route?: AdminRouteDetails;
  saving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (values: NewRouteInput) => void;
}) {
  const { t } = useTranslation();
  const operators = useAdminOperators();
  const stops = useStops();
  const isNew = !route;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(isNew ? newRouteSchema : schema),
    defaultValues: {
      routeNumber: route?.routeNumber ?? '',
      operatorId: route ? String(route.operator.id) : '',
      fromCode: route?.from.code ?? '',
      toCode: route?.to.code ?? '',
      departureTime: route?.departureTime ?? '',
      arrivalTime: route?.arrivalTime ?? '',
      price: route ? String(route.price) : '',
      serviceType: route?.serviceType ?? 'normal',
      busNumber: route?.busNumber ?? '',
    },
  });
  const { errors } = form.formState;

  // Deactivated operators can't take new routes, but stay listed for the
  // route that already belongs to one.
  const operatorOptions =
    operators.data?.filter((o) => o.isActive || o.id === route?.operator.id) ??
    [];

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(({ busNumber, ...values }) =>
        onSubmit({ ...values, busNumber: busNumber || undefined }),
      )}
    >
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        {isNew ? (
          <>
            <SelectField
              label={t('search.from')}
              error={errors.fromCode?.message}
              {...form.register('fromCode')}
            >
              <option value="">{t('search.chooseCity')}</option>
              {stops.data?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t('search.to')}
              error={errors.toCode?.message}
              {...form.register('toCode')}
            >
              <option value="">{t('search.chooseCity')}</option>
              {stops.data?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </>
        ) : (
          <p className="text-sm sm:col-span-2">
            <span className="text-slate-500">{t('admin.routes.stops')}: </span>
            <span className="font-medium">
              {route.from.name} → {route.to.name}
            </span>
          </p>
        )}
        <SelectField
          label={t('search.operator')}
          error={errors.operatorId?.message}
          {...form.register('operatorId')}
        >
          <option value="">{t('admin.routes.chooseOperator')}</option>
          {operatorOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('search.busType')}
          error={errors.serviceType?.message}
          {...form.register('serviceType')}
        >
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`serviceTypes.${type}`)} ({t(`seatLayouts.${type}`)})
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('admin.routes.routeNumber')}
          error={errors.routeNumber}
          {...form.register('routeNumber')}
        />
        <TextField
          label={t('admin.routes.busNumber')}
          hint={t('admin.routes.busNumberHint')}
          error={errors.busNumber}
          {...form.register('busNumber')}
        />
        <TextField
          label={t('route.start')}
          type="time"
          error={errors.departureTime}
          {...form.register('departureTime')}
        />
        <TextField
          label={t('route.end')}
          type="time"
          hint={t('admin.routes.overnightHint')}
          error={errors.arrivalTime}
          {...form.register('arrivalTime')}
        />
        <TextField
          label={t('admin.routes.fare')}
          type="number"
          inputMode="decimal"
          min={1}
          hint={t('admin.routes.fareHint')}
          error={errors.price}
          {...form.register('price')}
        />
      </div>
      <Button type="submit" disabled={saving} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
