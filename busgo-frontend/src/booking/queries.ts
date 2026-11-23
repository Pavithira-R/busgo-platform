import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NewBooking, Ticket } from '../lib/types';

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
