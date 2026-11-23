import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { BookingSummary } from '../booking/BookingSummary';
import { type Passenger, PassengerStep } from '../booking/PassengerStep';
import { PaymentStep } from '../booking/PaymentStep';
import { useCreateBooking } from '../booking/queries';
import { SeatMap } from '../booking/SeatMap';
import { Button, Card, ErrorMessage, Spinner } from '../components/ui';
import { ApiError } from '../lib/api';
import { hasDeparted, isBookableDate } from '../lib/dates';
import { SERVICE_FEE } from '../lib/format';
import type { PaymentMethod, RouteDetails } from '../lib/types';
import { useRouteDetails, useSeatMap } from '../search/queries';
import { routeUrl } from '../search/url';

const STEPS = ['seat', 'passenger', 'payment'] as const;
type Step = (typeof STEPS)[number];

/** /book/:id?date=2026-12-01: seat → passenger → payment → e-ticket. */
export function BookingPage() {
  const { t } = useTranslation();
  const id = Number(useParams().id);
  const date = useSearchParams()[0].get('date') ?? '';
  const details = useRouteDetails(id);

  if (details.isPending) return <Spinner label={t('common.loading')} />;
  if (details.error) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorMessage>
          {details.error instanceof ApiError && details.error.status === 404
            ? t('route.notFound')
            : details.error.message}
        </ErrorMessage>
      </div>
    );
  }
  if (!isBookableDate(date) || hasDeparted(date, details.data.departureTime)) {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <p>{t('booking.unavailable')}</p>
        <Link
          to={`/search?from=${details.data.from.code}&to=${details.data.to.code}`}
          className="mt-3 inline-block font-semibold text-brand-700 hover:underline dark:text-brand-200"
        >
          {t('search.change')}
        </Link>
      </Card>
    );
  }
  return <Booking route={details.data} date={date} />;
}

function Booking({ route, date }: { route: RouteDetails; date: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const seats = useSeatMap(route.id, date);
  const createBooking = useCreateBooking();

  const [step, setStep] = useState<Step>('seat');
  const [seat, setSeat] = useState<string | null>(null);
  const [boardingPointId, setBoardingPointId] = useState<number | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const boardingPoint =
    route.boardingPoints.find((p) => p.id === boardingPointId) ?? null;

  const pay = (paymentMethod: PaymentMethod) => {
    if (!seat || !passenger) return;
    createBooking.mutate(
      {
        routeId: route.id,
        travelDate: date,
        seatNumber: seat,
        boardingPointId: boardingPointId ?? undefined,
        ...passenger,
        paymentMethod,
      },
      {
        onSuccess: (ticket) =>
          void navigate(`/tickets/${ticket.ticketId}`, {
            replace: true,
            state: { justBooked: true },
          }),
        onError: (error) => {
          // Someone else took the seat meanwhile: pick again.
          if (error instanceof ApiError && error.status === 409) {
            setNotice(t('booking.seatTaken', { seat }));
            setSeat(null);
            setStep('seat');
            void seats.refetch();
          }
        },
      },
    );
  };
  const payError =
    createBooking.error &&
    !(
      createBooking.error instanceof ApiError &&
      createBooking.error.status === 409
    )
      ? createBooking.error.message
      : null;

  return (
    <div className="flex flex-col gap-5">
      <Link
        to={routeUrl(route.id, date)}
        className="self-start text-sm font-semibold text-brand-700 hover:underline dark:text-brand-200"
      >
        ← {t('booking.backToBus')}
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {t('booking.title')}
      </h1>

      <ol className="flex gap-2 text-sm">
        {STEPS.map((s, i) => {
          const current = s === step;
          const done = STEPS.indexOf(step) > i;
          return (
            <li
              key={s}
              aria-current={current ? 'step' : undefined}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 font-medium ${
                current
                  ? 'bg-brand-700 text-white'
                  : done
                    ? 'bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-100'
                    : 'bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800'
              }`}
            >
              <span>{i + 1}</span>
              <span>{t(`booking.steps.${s}`)}</span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <Card>
          {step === 'seat' && (
            <div className="flex flex-col gap-5">
              {notice && <ErrorMessage>{notice}</ErrorMessage>}
              <div>
                <h2 className="text-lg font-semibold">
                  {t('booking.chooseSeat')}
                </h2>
                <p className="text-sm text-slate-500">
                  {t(`seatLayouts.${route.serviceType}`)}
                </p>
              </div>
              {seats.isPending && <Spinner label={t('common.loading')} />}
              {seats.error && (
                <ErrorMessage>{seats.error.message}</ErrorMessage>
              )}
              {seats.data && (
                <SeatMap
                  map={seats.data}
                  selected={seat}
                  onSelect={(s) => {
                    setSeat(s);
                    setNotice(null);
                  }}
                />
              )}

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('booking.boardingQuestion')}
                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  value={boardingPointId ?? ''}
                  onChange={(e) =>
                    setBoardingPointId(Number(e.target.value) || null)
                  }
                >
                  <option value="">
                    {t('booking.startingStand', {
                      name: route.from.name,
                      time: route.departureTime,
                    })}
                  </option>
                  {route.boardingPoints.map((p) => (
                    <option key={p.id} value={p.id}>
                      {t('booking.boardingOption', {
                        name: p.name,
                        time: p.time,
                      })}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                disabled={!seat}
                onClick={() => setStep('passenger')}
                className="w-full"
              >
                {seat
                  ? t('booking.continueWithSeat', { seat })
                  : t('booking.noSeat')}
              </Button>
            </div>
          )}

          {step === 'passenger' && (
            <PassengerStep
              initial={passenger}
              onBack={() => setStep('seat')}
              onNext={(p) => {
                setPassenger(p);
                setStep('payment');
              }}
            />
          )}

          {step === 'payment' && passenger && (
            <PaymentStep
              total={route.price + SERVICE_FEE}
              phone={passenger.passengerPhone}
              paying={createBooking.isPending}
              error={payError}
              onBack={() => setStep('passenger')}
              onPay={pay}
            />
          )}
        </Card>

        <BookingSummary
          route={route}
          date={date}
          seat={seat}
          boardingPoint={boardingPoint}
        />
      </div>
    </div>
  );
}
