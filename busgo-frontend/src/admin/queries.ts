import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Dashboard } from './types';

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
