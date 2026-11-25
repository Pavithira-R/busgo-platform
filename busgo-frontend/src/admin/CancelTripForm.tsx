import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField } from '../components/form';
import { Button, ErrorMessage } from '../components/ui';
import { formatDate, todayInSriLanka } from '../lib/dates';
import { formatLkr } from '../lib/format';
import { useCancelTrip } from './queries';

/**
 * The operator can't run one day's trip (breakdown, strike, flooding...):
 * every passenger booked that day gets a full refund and an email.
 */
export function CancelTripForm({ routeId }: { routeId: number }) {
  const { t, i18n } = useTranslation();
  const cancel = useCancelTrip(routeId);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const review = () => {
    if (!date) return setProblem(t('admin.cancelTrip.needDate'));
    if (reason.trim().length < 3)
      return setProblem(t('admin.cancelTrip.needReason'));
    setProblem(null);
    cancel.reset();
    setConfirming(true);
  };
  const longDate = date
    ? formatDate(date, i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold">{t('admin.cancelTrip.title')}</h3>
        <p className="text-sm text-slate-500">{t('admin.cancelTrip.hint')}</p>
      </div>

      {cancel.data && (
        <p
          role="status"
          className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200 dark:bg-brand-900 dark:text-brand-100 dark:ring-brand-800"
        >
          {t('admin.cancelTrip.done', {
            count: cancel.data.cancelledBookings,
            amount: formatLkr(cancel.data.totalRefunded),
          })}
        </p>
      )}
      {(problem || cancel.error) && (
        <ErrorMessage>{problem ?? cancel.error?.message}</ErrorMessage>
      )}

      {confirming ? (
        <div className="flex flex-col gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200 dark:bg-red-950 dark:ring-red-900">
          <p className="text-sm text-red-900 dark:text-red-100">
            {t('admin.cancelTrip.confirmText', { date: longDate })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="danger"
              disabled={cancel.isPending}
              onClick={() =>
                cancel.mutate(
                  { travelDate: date, reason: reason.trim() },
                  {
                    onSettled: () => setConfirming(false),
                    onSuccess: () => {
                      setDate('');
                      setReason('');
                    },
                  },
                )
              }
            >
              {t('admin.cancelTrip.confirm')}
            </Button>
            <Button
              variant="secondary"
              disabled={cancel.isPending}
              onClick={() => setConfirming(false)}
            >
              {t('admin.cancelTrip.back')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr_auto] sm:items-start">
          <TextField
            label={t('admin.cancelTrip.date')}
            type="date"
            min={todayInSriLanka()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            label={t('admin.cancelTrip.reason')}
            hint={t('admin.cancelTrip.reasonHint')}
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button variant="danger" className="sm:mt-6" onClick={review}>
            {t('admin.cancelTrip.submit')}
          </Button>
        </div>
      )}
    </div>
  );
}
