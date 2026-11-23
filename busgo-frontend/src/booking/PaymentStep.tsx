import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TextField } from '../components/form';
import { Button, ErrorMessage } from '../components/ui';
import { formatLkr } from '../lib/format';
import type { PaymentMethod } from '../lib/types';
import { cardCvv, cardExpiry, cardNumber, mobile } from '../lib/validation';

const METHODS: PaymentMethod[] = ['card', 'ez_cash', 'bank_transfer'];

/** Which fields each method needs. Nothing here is sent to the server. */
const required: Record<PaymentMethod, Record<string, z.ZodTypeAny>> = {
  card: { cardNumber, cardExpiry, cardCvv },
  ez_cash: { ezCashMobile: mobile },
  bank_transfer: {},
};

const schema = z
  .object({
    method: z.enum(['card', 'ez_cash', 'bank_transfer']),
    cardNumber: z.string(),
    cardExpiry: z.string(),
    cardCvv: z.string(),
    ezCashMobile: z.string(),
  })
  .superRefine((values, ctx) => {
    for (const [field, check] of Object.entries(required[values.method])) {
      const result = check.safeParse(values[field as keyof typeof values]);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: result.error.issues[0].message,
        });
      }
    }
  });
type PaymentForm = z.infer<typeof schema>;

/** Simulated payment: pick a method, fill in demo details, confirm. */
export function PaymentStep({
  total,
  phone,
  paying,
  error,
  onBack,
  onPay,
}: {
  total: number;
  /** Passenger's mobile, suggested for eZ Cash. */
  phone: string;
  paying: boolean;
  error: string | null;
  onBack: () => void;
  onPay: (method: PaymentMethod) => void;
}) {
  const { t } = useTranslation();
  const form = useForm<PaymentForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: 'card',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      ezCashMobile: phone,
    },
  });
  const method = useWatch({ control: form.control, name: 'method' });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) => onPay(values.method))}
    >
      <div>
        <h2 className="text-lg font-semibold">{t('booking.paymentTitle')}</h2>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900">
          {t('booking.demoNotice')}
        </p>
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('booking.paymentMethod')}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium ring-1 ${
                method === m
                  ? 'bg-brand-50 text-brand-900 ring-2 ring-brand-600 dark:bg-brand-900 dark:text-brand-50'
                  : 'ring-slate-300 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                value={m}
                className="accent-brand-700"
                {...form.register('method')}
              />
              {t(`booking.methods.${m}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {method === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              label={t('booking.cardNumber')}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0000 0000 0000 0000"
              hint={t('booking.cardHint')}
              error={errors.cardNumber}
              {...form.register('cardNumber')}
            />
          </div>
          <TextField
            label={t('booking.cardExpiry')}
            inputMode="numeric"
            autoComplete="off"
            placeholder="MM/YY"
            error={errors.cardExpiry}
            {...form.register('cardExpiry')}
          />
          <TextField
            label={t('booking.cardCvv')}
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            error={errors.cardCvv}
            {...form.register('cardCvv')}
          />
        </div>
      )}
      {method === 'ez_cash' && (
        <TextField
          label={t('booking.ezCashMobile')}
          type="tel"
          inputMode="tel"
          error={errors.ezCashMobile}
          {...form.register('ezCashMobile')}
        />
      )}
      {method === 'bank_transfer' && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('booking.bankNotice')}
        </p>
      )}

      <div className="mt-2 flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={paying}>
          {t('booking.back')}
        </Button>
        <Button type="submit" className="flex-1" disabled={paying}>
          {paying
            ? t('booking.paying')
            : t('booking.pay', { amount: formatLkr(total) })}
        </Button>
      </div>
    </form>
  );
}
