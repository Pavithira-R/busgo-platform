import { useTranslation } from 'react-i18next';
import type { BookingStatus } from '../lib/types';

const styles = {
  confirmed: 'bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-100',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200',
  done: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

/**
 * Booking status. A confirmed ticket whose bus has left shows as
 * "Travelled" rather than "Confirmed".
 */
export function TicketStatusBadge({
  status,
  departed,
}: {
  status: BookingStatus;
  departed: boolean;
}) {
  const { t } = useTranslation();
  const travelled = status === 'confirmed' && departed;
  const style =
    status === 'cancelled'
      ? styles.cancelled
      : status === 'confirmed' && !travelled
        ? styles.confirmed
        : styles.done;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {travelled ? t('ticket.status.travelled') : t(`ticket.status.${status}`)}
    </span>
  );
}
