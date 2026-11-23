import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CancellationQuote, NewBooking, Ticket } from '../lib/types';

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: ({ signal }) => api<Ticket>(`/bookings/${ticketId}`, { signal }),
  });
}

/** Books one seat. The new ticket (with its QR code) is cached for the ticket page. */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (booking: NewBooking) =>
      api<Ticket>('/bookings', { method: 'POST', body: booking }),
    onSuccess: (ticket) => {
      queryClient.setQueryData(['ticket', ticket.ticketId], ticket);
      // Seat counts and the bookings list have changed.
      void queryClient.invalidateQueries({ queryKey: ['seats'] });
      void queryClient.invalidateQueries({ queryKey: ['routes'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/** The signed-in passenger's bookings, newest first. */
export function useMyBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: ({ signal }) => api<Ticket[]>('/bookings', { signal }),
  });
}

/** Refund preview; only fetched once the passenger asks to cancel. */
export function useCancellationQuote(ticketId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['cancellation', ticketId],
    queryFn: ({ signal }) =>
      api<CancellationQuote>(`/bookings/${ticketId}/cancellation`, { signal }),
    enabled,
    // The refund shrinks as departure gets closer, so always ask again.
    staleTime: 0,
  });
}

export function useCancelBooking(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<Ticket>(`/bookings/${ticketId}/cancel`, { method: 'PUT' }),
    onSuccess: (cancelled) => {
      // The reply has no QR code, as a cancelled ticket can't be used.
      queryClient.setQueryData(['ticket', ticketId], cancelled);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['seats'] });
      void queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}
