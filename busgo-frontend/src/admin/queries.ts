import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Ticket } from '../lib/types';
import type {
  AdminOperator,
  AdminPassenger,
  BookingFilters,
  Page,
  StaffMember,
  AdminRoute,
  AdminRouteDetails,
  CancelTripResult,
  Dashboard,
  NewRouteInput,
  RouteInput,
} from './types';

export function useDashboard(range: { from: string; to: string }) {
  return useQuery({
    queryKey: ['admin', 'dashboard', range],
    queryFn: ({ signal }) =>
      api<Dashboard>(`/admin/dashboard?${new URLSearchParams(range)}`, {
        signal,
      }),
    // Keep the old numbers on screen while another range loads.
    placeholderData: (previous) => previous,
  });
}

// ---------- Operators ----------

export function useAdminOperators() {
  return useQuery({
    queryKey: ['admin', 'operators'],
    queryFn: ({ signal }) =>
      api<AdminOperator[]>('/admin/operators', { signal }),
  });
}

/** Operators and routes also appear in the passenger search. */
function refreshCatalog(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['admin'] });
  void queryClient.invalidateQueries({ queryKey: ['routes'] });
  void queryClient.invalidateQueries({ queryKey: ['route'] });
}

export function useSaveOperator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id?: number;
      name?: string;
      phone?: string;
      isActive?: boolean;
    }) =>
      id
        ? api<AdminOperator>(`/admin/operators/${id}`, {
            method: 'PATCH',
            body,
          })
        : api<AdminOperator>('/admin/operators', { method: 'POST', body }),
    onSuccess: () => refreshCatalog(queryClient),
  });
}

// ---------- Routes ----------

export function useAdminRoutes(operatorId: number | null) {
  return useQuery({
    queryKey: ['admin', 'routes', { operatorId }],
    queryFn: ({ signal }) =>
      api<AdminRoute[]>(
        `/admin/routes${operatorId ? `?operatorId=${operatorId}` : ''}`,
        { signal },
      ),
  });
}

export function useAdminRoute(id: number) {
  return useQuery({
    queryKey: ['admin', 'route', id],
    queryFn: ({ signal }) =>
      api<AdminRouteDetails>(`/admin/routes/${id}`, { signal }),
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NewRouteInput) =>
      api<AdminRouteDetails>('/admin/routes', { method: 'POST', body }),
    onSuccess: () => refreshCatalog(queryClient),
  });
}

/** Changes that return the updated route: details, on/off sale, boarding points. */
function useRouteChange<T>(
  id: number,
  request: (body: T) => Promise<AdminRouteDetails>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (route) => {
      queryClient.setQueryData(['admin', 'route', id], route);
      refreshCatalog(queryClient);
    },
  });
}

/** busNumber null clears it; isActive takes the route on or off sale. */
type RouteChanges = Partial<Omit<RouteInput, 'busNumber'>> & {
  busNumber?: string | null;
  isActive?: boolean;
};

export function useUpdateRoute(id: number) {
  return useRouteChange(id, (body: RouteChanges) =>
    api<AdminRouteDetails>(`/admin/routes/${id}`, { method: 'PATCH', body }),
  );
}

export function useSaveBoardingPoints(id: number) {
  return useRouteChange(
    id,
    (points: { id?: number; name: string; minutesFromStart: number }[]) =>
      api<AdminRouteDetails>(`/admin/routes/${id}/boarding-points`, {
        method: 'PUT',
        body: { points },
      }),
  );
}

/** The operator cancels one day: every passenger gets a full refund. */
export function useCancelTrip(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { travelDate: string; reason: string }) =>
      api<CancelTripResult>(`/admin/routes/${id}/cancel-trip`, {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
      void queryClient.invalidateQueries({ queryKey: ['seats'] });
      void queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}

// ---------- People ----------

/** Rows per page in the admin lists. */
export const PAGE_SIZE = 20;

/** Builds ?a=1&b=2 from the given values, leaving out empty ones. */
function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

export function useAdminBookings(filters: BookingFilters) {
  return useQuery({
    queryKey: ['admin', 'bookings', filters],
    queryFn: ({ signal }) =>
      api<Page<Ticket>>(
        `/admin/bookings?${query({ ...filters, limit: PAGE_SIZE })}`,
        { signal },
      ),
    placeholderData: (previous) => previous,
  });
}

export function useAdminPassengers(search: string, page: number) {
  return useQuery({
    queryKey: ['admin', 'passengers', { search, page }],
    queryFn: ({ signal }) =>
      api<Page<AdminPassenger>>(
        `/admin/passengers?${query({ search, page, limit: PAGE_SIZE })}`,
        { signal },
      ),
    placeholderData: (previous) => previous,
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: ({ signal }) => api<StaffMember[]>('/admin/staff', { signal }),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
    }) => api<StaffMember>('/admin/staff', { method: 'POST', body }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] }),
  });
}

/** Deactivated users can't sign in, and their current login stops working. */
export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api(`/admin/users/${id}/status`, { method: 'PATCH', body: { isActive } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'passengers'] });
    },
  });
}
