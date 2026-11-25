// Shapes returned by the admin API (/api/admin/...).
import type { BookingStatus, RouteSummary, ServiceType } from '../lib/types';

export interface Dashboard {
  range: { from: string; to: string };
  bookings: {
    total: number;
    confirmed: number;
    used: number;
    cancelled: number;
  };
  /** LKR. Net = gross sales minus refunds. */
  revenue: { grossSales: number; refunds: number; netRevenue: number };
  today: { bookedToday: number; travellingToday: number };
  passengers: { total: number; newInRange: number };
  popularRoutes: {
    routeId: number;
    routeNumber: string;
    from: string;
    to: string;
    departureTime: string;
    operator: string;
    bookings: number;
    revenue: number;
  }[];
  byOperator: {
    operatorId: number;
    operator: string;
    bookings: number;
    revenue: number;
  }[];
  /** One entry per day in the range, including days without bookings. */
  daily: { date: string; bookings: number; revenue: number }[];
}

export interface AdminOperator {
  id: number;
  name: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  routeCount: number;
}

/** A route as admins see it, including ones that are not on sale. */
export type AdminRoute = Omit<RouteSummary, 'via' | 'availableSeats'> & {
  isActive: boolean;
  /** false when the route's operator has been deactivated. */
  operatorActive: boolean;
};

export interface AdminBoardingPoint {
  id: number;
  name: string;
  order: number;
  minutesFromStart: number;
  /** Estimated time, "HH:MM". */
  time: string;
}

export type AdminRouteDetails = AdminRoute & {
  /** Confirmed bookings from today on. */
  upcomingBookings: number;
  boardingPoints: AdminBoardingPoint[];
};

/** Fields an admin can set on a route. Stops are fixed after creation. */
export interface RouteInput {
  routeNumber: string;
  operatorId: number;
  departureTime: string;
  arrivalTime: string;
  price: number;
  serviceType: ServiceType;
  busNumber?: string;
}
export type NewRouteInput = RouteInput & { fromCode: string; toCode: string };

export interface CancelTripResult {
  cancelledBookings: number;
  totalRefunded: number;
}

/** One page of a long list. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminPassenger {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  /** Number of bookings made. */
  bookings: number;
  /** Timestamp of the latest booking, or null if none. */
  lastBookedAt: string | null;
}

export interface StaffMember {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: 'staff' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface BookingFilters {
  search?: string;
  status?: BookingStatus;
  travelDate?: string;
  operatorId?: number;
  page: number;
}
