// Shapes returned by the BusGo API (see the backend's Swagger docs at /docs).

export type Role = 'passenger' | 'staff' | 'admin';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  idNumber: string | null;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export type ServiceType = 'normal' | 'semi_luxury' | 'luxury' | 'super_luxury';

export interface BusStop {
  code: string;
  name: string;
  city: string;
}

export interface Operator {
  id: number;
  name: string;
}

/** A bus service as listed in search results. */
export interface RouteSummary {
  id: number;
  routeNumber: string;
  /** "HH:MM", Sri Lanka time. */
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  /** Fare in LKR, before the service fee. */
  price: number;
  serviceType: ServiceType;
  totalSeats: number;
  busNumber: string;
  operator: Operator;
  from: BusStop;
  to: BusStop;
  /** Towns the bus stops at on the way, in order. */
  via: string[];
  /** Free seats on the searched date (only when a date was given). */
  availableSeats?: number;
}

export interface BoardingPoint {
  id: number;
  name: string;
  order: number;
  /** Estimated time the bus reaches this town, "HH:MM". */
  time: string;
}

export type RouteDetails = Omit<RouteSummary, 'via' | 'availableSeats'> & {
  boardingPoints: BoardingPoint[];
};

export interface SeatMap {
  routeId: number;
  date: string;
  /** Seats per row, with the aisle after `aisleAfter` seats from the left. */
  layout: { rows: number; seatsPerRow: number; aisleAfter: number };
  totalSeats: number;
  availableSeats: number;
  seats: { number: string; status: 'available' | 'booked' }[];
}

/** Simulated payment: no real money is taken. */
export type PaymentMethod = 'card' | 'ez_cash' | 'bank_transfer';
export type BookingStatus = 'confirmed' | 'cancelled' | 'used' | 'expired';

/** A booking / e-ticket as the API returns it. */
export interface Ticket {
  ticketId: string;
  status: BookingStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod: PaymentMethod | null;
  travelDate: string;
  seatNumber: string;
  route: Pick<
    RouteSummary,
    | 'id'
    | 'routeNumber'
    | 'operator'
    | 'from'
    | 'to'
    | 'departureTime'
    | 'arrivalTime'
    | 'serviceType'
    | 'busNumber'
  >;
  /** Where to get on, with the estimated time the bus arrives there. */
  boarding: { name: string; time: string; isStartingStand: boolean };
  passenger: {
    name: string;
    email: string;
    phone: string | null;
    idNumber: string | null;
  };
  price: { fare: number; serviceFee: number; total: number };
  cancellation: {
    cancelledAt: string;
    charge: number;
    refundAmount: number;
  } | null;
  bookedAt: string;
  /** PNG data URL, included when viewing a single ticket. */
  qrCode?: string;
}

export interface NewBooking {
  routeId: number;
  travelDate: string;
  seatNumber: string;
  /** Leave out to board at the starting bus stand. */
  boardingPointId?: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengerIdNumber?: string;
  paymentMethod: PaymentMethod;
}

/** What the passenger gets back if they cancel now. */
export type CancellationQuote =
  | {
      canCancel: true;
      hoursBeforeDeparture: number;
      fare: number;
      serviceFee: number;
      cancellationPercent: number;
      cancellationFee: number;
      processingFee: number;
      refundAmount: number;
    }
  | { canCancel: false; reason: string };
