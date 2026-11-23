import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  BusStop,
  RouteDetails,
  RouteSummary,
  SeatMap,
} from '../lib/types';

// Stops rarely change, so they are kept for the whole visit.
export function useStops() {
  return useQuery({
    queryKey: ['stops'],
    queryFn: ({ signal }) => api<BusStop[]>('/routes/stops', { signal }),
    staleTime: Infinity,
  });
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
}

/** Buses between two stops, with the free seats on `date`. */
export function useRouteSearch({ from, to, date }: SearchParams) {
  return useQuery({
    queryKey: ['routes', { from, to, date }],
    queryFn: ({ signal }) =>
      api<RouteSummary[]>(
        `/routes?${new URLSearchParams({ from, to, date })}`,
        { signal },
      ),
  });
}

export function useRouteDetails(id: number) {
  return useQuery({
    queryKey: ['route', id],
    queryFn: ({ signal }) => api<RouteDetails>(`/routes/${id}`, { signal }),
  });
}

export function useSeatMap(id: number, date: string) {
  return useQuery({
    queryKey: ['seats', id, date],
    queryFn: ({ signal }) =>
      api<SeatMap>(`/routes/${id}/seats?date=${date}`, { signal }),
  });
}
