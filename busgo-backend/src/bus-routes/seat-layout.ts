import type { BusRoute } from '../db/schema.js';

type ServiceType = BusRoute['serviceType'];

export interface SeatLayout {
  rows: number;
  /** Seats per row, e.g. 4 for "2 + aisle + 2". */
  seatsPerRow: number;
  /** The aisle comes after this many seats from the left. */
  aisleAfter: number;
}

/** Bus layouts from the proposal (section 6.4). */
const LAYOUTS: Record<ServiceType, SeatLayout> = {
  standard: { rows: 12, seatsPerRow: 4, aisleAfter: 2 }, // 48 seats
  semi_luxury: { rows: 10, seatsPerRow: 4, aisleAfter: 2 }, // 40 seats
  luxury: { rows: 8, seatsPerRow: 3, aisleAfter: 2 }, // 24 wider seats
};

export function layoutFor(serviceType: ServiceType): SeatLayout {
  return LAYOUTS[serviceType];
}

/** Seat labels row by row: A1, A2, A3, A4, B1, ... */
export function seatLabels({ rows, seatsPerRow }: SeatLayout): string[] {
  const labels: string[] = [];
  for (let r = 0; r < rows; r++) {
    const row = String.fromCharCode(65 + r); // A, B, C...
    for (let s = 1; s <= seatsPerRow; s++) labels.push(`${row}${s}`);
  }
  return labels;
}

export function isValidSeat(serviceType: ServiceType, seat: string): boolean {
  return seatLabels(layoutFor(serviceType)).includes(seat);
}
