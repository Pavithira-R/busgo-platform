import type {
  BusStop,
  RouteDetails,
  RouteSummary,
  SeatMap,
  Ticket,
} from '../lib/types';

// Sample API data for tests.

export const stops: BusStop[] = [
  { code: 'CMB', name: 'Colombo Central Bus Stand', city: 'Colombo' },
  { code: 'GLE', name: 'Galle Bus Stand', city: 'Galle' },
  { code: 'KDY', name: 'Kandy Goods Shed Bus Stand', city: 'Kandy' },
];

export function makeRoute(overrides: Partial<RouteSummary> = {}): RouteSummary {
  return {
    id: 1,
    routeNumber: '01',
    departureTime: '06:00',
    arrivalTime: '09:30',
    durationMinutes: 210,
    price: 420,
    serviceType: 'normal',
    totalSeats: 50,
    busNumber: 'NB-4521',
    operator: { id: 2, name: 'Hill Country Express' },
    from: stops[0],
    to: stops[2],
    via: ['Kadawatha', 'Kegalle'],
    availableSeats: 50,
    ...overrides,
  };
}

export const routeDetails: RouteDetails = {
  ...(({ via: _via, availableSeats: _seats, ...route }) => route)(makeRoute()),
  boardingPoints: [
    { id: 1, name: 'Kadawatha', order: 1, time: '06:25' },
    { id: 4, name: 'Kegalle', order: 2, time: '07:56' },
  ],
};

export const seatMap: SeatMap = {
  routeId: 1,
  date: '2026-12-03',
  // A small 2+2 bus: A1 is taken.
  layout: { rows: 2, seatsPerRow: 4, aisleAfter: 2 },
  totalSeats: 8,
  availableSeats: 7,
  seats: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'].map((number) => ({
    number,
    status: number === 'A1' ? 'booked' : 'available',
  })),
};

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  const { via: _via, availableSeats: _seats, ...route } = makeRoute();
  return {
    ticketId: 'BG-7K2M9QXA',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    travelDate: '2026-12-03',
    seatNumber: 'A2',
    route,
    boarding: { name: 'Kegalle', time: '07:56', isStartingStand: false },
    passenger: {
      name: 'Kasun Perera',
      email: 'kasun@example.lk',
      phone: '0771234567',
      idNumber: null,
    },
    price: { fare: 420, serviceFee: 100, total: 520 },
    cancellation: null,
    bookedAt: '2026-12-01T04:30:00.000Z',
    qrCode: 'data:image/png;base64,iVBORw0KGgo=',
    ...overrides,
  };
}
