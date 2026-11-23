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
