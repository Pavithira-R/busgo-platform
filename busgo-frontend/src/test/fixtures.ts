import type { BusStop, RouteDetails, RouteSummary } from '../lib/types';

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
