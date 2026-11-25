import type {
  AdminOperator,
  AdminRoute,
  AdminRouteDetails,
} from '../admin/types';
import { makeRoute } from './fixtures';

// Sample admin API data for tests.

export const operators: AdminOperator[] = [
  {
    id: 1,
    name: 'Ceylon Comfort Lines',
    phone: '0112345601',
    isActive: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    routeCount: 3,
  },
  {
    id: 2,
    name: 'Hill Country Express',
    phone: null,
    isActive: false,
    createdAt: '2026-11-01T00:00:00.000Z',
    routeCount: 1,
  },
];

export function makeAdminRoute(
  overrides: Partial<AdminRoute> = {},
): AdminRoute {
  const { via: _via, availableSeats: _seats, ...route } = makeRoute();
  return { ...route, isActive: true, operatorActive: true, ...overrides };
}

export function makeAdminRouteDetails(
  overrides: Partial<AdminRouteDetails> = {},
): AdminRouteDetails {
  return {
    ...makeAdminRoute(),
    upcomingBookings: 4,
    boardingPoints: [
      {
        id: 1,
        name: 'Kadawatha',
        order: 1,
        minutesFromStart: 25,
        time: '06:25',
      },
      {
        id: 4,
        name: 'Kegalle',
        order: 2,
        minutesFromStart: 116,
        time: '07:56',
      },
    ],
    ...overrides,
  };
}
