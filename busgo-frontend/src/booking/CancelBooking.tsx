import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, ErrorMessage, Spinner } from '../components/ui';
import { formatLkr } from '../lib/format';
import { useCancelBooking, useCancellationQuote } from './queries';

/**
 * "Cancel booking": shows exactly how much comes back (from the server's
 * refund rules) and asks for confirmation before cancelling.
 */
export function CancelBooking({
  ticketId,
  onCancelled,
}: {
  ticketId: string;
  onCancelled: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const quote = useCancellationQuote(ticketId, open);
  const cancel = useCancelBooking(ticketId);

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="self-start text-red-700 dark:text-red-300"
        onClick={() => setOpen(true)}
      >
        {t('cancel.button')}
      </Button>
    );
  }

  return (
    <Card className="print:hidden">
      <h2 className="font-semibold">{t('cancel.title')}</h2>
      {quote.isPending && <Spinner label={t('common.loading')} />}
      {quote.error && <ErrorMessage>{quote.error.message}</ErrorMessage>}
      {quote.data && !quote.data.canCancel && (
        <div className="mt-3 flex flex-col gap-3">
          <ErrorMessage>{quote.data.reason}</ErrorMessage>
          <Button
            variant="secondary"
            className="self-start"
            onClick={() => setOpen(false)}
          >
            {t('cancel.close')}
          </Button>
        </div>
      )}
      {quote.data?.canCancel && (
        <>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">
                {t('cancel.fare')}
              </dt>
              <dd>{formatLkr(quote.data.fare)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">
                {t('cancel.charge', {
                  percent: quote.data.cancellationPercent,
                })}
              </dt>
              <dd>− {formatLkr(quote.data.cancellationFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">
                {t('cancel.processingFee')}
              </dt>
              <dd>− {formatLkr(quote.data.processingFee)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700">
              <dt>{t('cancel.refund')}</dt>
              <dd className="text-brand-800 dark:text-brand-200">
                {formatLkr(quote.data.refundAmount)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-slate-500">
            {t('cancel.serviceFeeNote', {
              amount: formatLkr(quote.data.serviceFee),
            })}
          </p>
          {cancel.error && (
            <div className="mt-3">
              <ErrorMessage>{cancel.error.message}</ErrorMessage>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="danger"
              disabled={cancel.isPending}
              onClick={() =>
                cancel.mutate(undefined, { onSuccess: onCancelled })
              }
            >
              {cancel.isPending ? t('cancel.cancelling') : t('cancel.confirm')}
            </Button>
            <Button
              variant="secondary"
              disabled={cancel.isPending}
              onClick={() => setOpen(false)}
            >
              {t('cancel.keep')}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
