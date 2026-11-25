/** BusGo's flat booking fee per seat, in LKR. Never refunded by passengers' cancellations. */
export const SERVICE_FEE = 100;

export interface Price {
  fare: number;
  serviceFee: number;
  total: number;
}

export function priceFor(fare: number): Price {
  return { fare, serviceFee: SERVICE_FEE, total: fare + SERVICE_FEE };
}

const HOUR = 60 * 60 * 1000;

/**
 * Cancellation charges by how long before departure the passenger cancels
 * (based on common Sri Lankan online bus booking policies):
 *   more than 7 days   5% of fare + LKR 300 processing
 *   3 to 7 days       10% of fare + LKR 300
 *   24 to 72 hours    12% of fare + LKR 350
 *   under 24 hours    15% of fare + LKR 350
 *   after departure   cannot cancel (no refund)
 */
const TIERS = [
  {
    minHours: 7 * 24,
    exclusive: true,
    percent: 5,
    processingFee: 300,
    label: 'More than 7 days before departure',
  },
  {
    minHours: 72,
    exclusive: false,
    percent: 10,
    processingFee: 300,
    label: '3 to 7 days before departure',
  },
  {
    minHours: 24,
    exclusive: false,
    percent: 12,
    processingFee: 350,
    label: '24 to 72 hours before departure',
  },
  {
    minHours: 0,
    exclusive: true,
    percent: 15,
    processingFee: 350,
    label: 'Less than 24 hours before departure',
  },
] as const;

export interface CancellationQuote {
  canCancel: boolean;
  /** Why it can't be cancelled, when canCancel is false. */
  reason?: string;
  tier?: string;
  hoursBeforeDeparture: number;
  fare: number;
  serviceFee: number;
  cancellationPercent: number;
  cancellationFee: number;
  processingFee: number;
  /** Not refunded: the service fee plus the charges above. */
  refundAmount: number;
}

/** Works out the refund if a passenger cancels at `now`. */
export function cancellationQuote(
  price: Pick<Price, 'fare' | 'serviceFee'>,
  departureAt: Date,
  now: Date = new Date(),
): CancellationQuote {
  const hours = (departureAt.getTime() - now.getTime()) / HOUR;
  const base = {
    hoursBeforeDeparture: Math.round(hours * 10) / 10,
    fare: price.fare,
    serviceFee: price.serviceFee,
  };

  const tier = TIERS.find((t) =>
    t.exclusive ? hours > t.minHours : hours >= t.minHours,
  );
  if (!tier) {
    return {
      ...base,
      canCancel: false,
      reason: 'The bus has already departed',
      cancellationPercent: 100,
      cancellationFee: price.fare,
      processingFee: 0,
      refundAmount: 0,
    };
  }

  const cancellationFee = round2((price.fare * tier.percent) / 100);
  const refundAmount = Math.max(
    0,
    round2(price.fare - cancellationFee - tier.processingFee),
  );
  return {
    ...base,
    canCancel: true,
    tier: tier.label,
    cancellationPercent: tier.percent,
    cancellationFee,
    processingFee: tier.processingFee,
    refundAmount,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
