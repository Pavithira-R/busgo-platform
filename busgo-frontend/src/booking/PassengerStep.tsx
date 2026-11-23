import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { TextField } from '../components/form';
import { Button } from '../components/ui';
import { email, fullName, mobile, nic, optional } from '../lib/validation';

const schema = z.object({
  passengerName: fullName,
  passengerEmail: email,
  passengerPhone: mobile,
  passengerIdNumber: optional(nic),
});
type PassengerInput = z.input<typeof schema>;
export type Passenger = z.output<typeof schema>;

/** Who is travelling. Filled in from the profile; can be someone else. */
export function PassengerStep({
  initial,
  onBack,
  onNext,
}: {
  initial: Passenger | null;
  onBack: () => void;
  onNext: (passenger: Passenger) => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const form = useForm<PassengerInput, unknown, Passenger>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? {
      passengerName: user?.fullName ?? '',
      passengerEmail: user?.email ?? '',
      passengerPhone: user?.phone ?? '',
      passengerIdNumber: user?.idNumber ?? '',
    },
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onNext)}
    >
      <div>
        <h2 className="text-lg font-semibold">{t('booking.passengerTitle')}</h2>
        <p className="text-sm text-slate-500">{t('booking.passengerHint')}</p>
      </div>
      <TextField
        label={t('booking.passengerName')}
        autoComplete="name"
        error={errors.passengerName}
        {...form.register('passengerName')}
      />
      <TextField
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        error={errors.passengerEmail}
        {...form.register('passengerEmail')}
      />
      <TextField
        label={t('auth.phone')}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint={t('booking.phoneHint')}
        error={errors.passengerPhone}
        {...form.register('passengerPhone')}
      />
      <TextField
        label={t('profile.nic')}
        hint={t('profile.nicHint')}
        error={errors.passengerIdNumber}
        {...form.register('passengerIdNumber')}
      />
      <div className="mt-2 flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          {t('booking.back')}
        </Button>
        <Button type="submit" className="flex-1">
          {t('booking.continue')}
        </Button>
      </div>
    </form>
  );
}
