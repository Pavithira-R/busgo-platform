import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { makeTicket } from '../test/fixtures';
import { makeUser, mockApi, renderWithProviders } from '../test/render';
import { MyBookingsPage } from './MyBookingsPage';

const bookings = [
  makeTicket({ ticketId: 'BG-LATER111', travelDate: '2026-12-20' }),
  makeTicket({ ticketId: 'BG-SOONER22', travelDate: '2026-12-03' }),
  // The 06:00 bus today has already left.
  makeTicket({ ticketId: 'BG-TODAY333', travelDate: '2026-12-01' }),
  makeTicket({
    ticketId: 'BG-CANCEL44',
    travelDate: '2026-12-10',
    status: 'cancelled',
  }),
];

function renderMyBookings(data = bookings) {
  mockApi({ '/bookings': data });
  renderWithProviders(
    <Routes>
      <Route path="bookings" element={<MyBookingsPage />} />
    </Routes>,
    { route: '/bookings', user: makeUser() },
  );
}

const ticketIds = () =>
  screen
    .getAllByRole('link')
    .map((link) => link.getAttribute('href'))
    .filter((href) => href?.startsWith('/tickets/'));

describe('MyBookingsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  it('lists upcoming trips first, soonest at the top', async () => {
    renderMyBookings();
    expect(
      await screen.findByRole('tab', { name: 'Upcoming (2)' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(ticketIds()).toEqual([
      '/tickets/BG-SOONER22',
      '/tickets/BG-LATER111',
    ]);
    const first = screen.getAllByRole('listitem')[0];
    expect(within(first).getByText('Colombo → Kandy')).toBeInTheDocument();
    expect(within(first).getByText('Confirmed')).toBeInTheDocument();
    expect(within(first).getByText('LKR 520')).toBeInTheDocument();
  });

  it('shows past and cancelled trips in the other tab', async () => {
    renderMyBookings();
    await userEvent.click(
      await screen.findByRole('tab', { name: 'Past & cancelled (2)' }),
    );
    expect(ticketIds()).toEqual([
      '/tickets/BG-CANCEL44',
      '/tickets/BG-TODAY333',
    ]);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Travelled')).toBeInTheDocument();
  });

  it('points to the search when there are no bookings', async () => {
    renderMyBookings([]);
    expect(
      await screen.findByText('You have no upcoming trips.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Search buses' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
