// Shapes returned by the admin API (/api/admin/...).

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
