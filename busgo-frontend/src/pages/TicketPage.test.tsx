import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { makeTicket } from '../test/fixtures';
import { makeUser, mockApi, renderWithProviders } from '../test/render';
import { TicketPage } from './TicketPage';

function renderTicket(path = '/tickets/BG-7K2M9QXA') {
  renderWithProviders(
    <Routes>
      <Route path="tickets/:ticketId" element={<TicketPage />} />
    </Routes>,
    { route: path, user: makeUser() },
  );
}

describe('TicketPage', () => {
  it('shows the e-ticket with its QR code', async () => {
    mockApi({ '/bookings/BG-7K2M9QXA': makeTicket() });
    renderTicket();

    expect(
      await screen.findByRole('img', {
        name: 'QR code for ticket BG-7K2M9QXA',
      }),
    ).toHaveAttribute('src', 'data:image/png;base64,iVBORw0KGgo=');
    expect(screen.getByText('Colombo → Kandy')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('BG-7K2M9QXA')).toBeInTheDocument();
    expect(screen.getByText('Kegalle, 07:56')).toBeInTheDocument();
    expect(screen.getByText('Thu, 3 Dec 2026')).toBeInTheDocument();
    expect(screen.getByText('Paid with Card')).toBeInTheDocument();
    expect(screen.getByText('LKR 520')).toBeInTheDocument();
    // The "just booked" message only shows straight after booking.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('hides the QR code of a cancelled ticket and shows the refund', async () => {
    mockApi({
      '/bookings/BG-7K2M9QXA': makeTicket({
        status: 'cancelled',
        cancellation: {
          cancelledAt: '2026-12-01T05:00:00.000Z',
          charge: 321,
          refundAmount: 99,
        },
      }),
    });
    renderTicket();
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Refunded LKR 99')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('says when the ticket does not exist', async () => {
    mockApi({});
    renderTicket('/tickets/BG-NOPE1234');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This ticket could not be found.',
    );
  });
});

describe('Cancelling a ticket', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  // 3 to 7 days before: 10% of LKR 420 + LKR 300.
  const quote = {
    canCancel: true,
    hoursBeforeDeparture: 92,
    fare: 420,
    serviceFee: 100,
    cancellationPercent: 10,
    cancellationFee: 42,
    processingFee: 300,
    refundAmount: 78,
  };

  it('shows the refund first, then cancels', async () => {
    const fetchSpy = mockApi({
      '/bookings/BG-7K2M9QXA/cancellation': quote,
      '/bookings/BG-7K2M9QXA': makeTicket(),
      'PUT /bookings/BG-7K2M9QXA/cancel': makeTicket({
        status: 'cancelled',
        qrCode: undefined,
        cancellation: {
          cancelledAt: '2026-12-01T04:31:00.000Z',
          charge: 342,
          refundAmount: 78,
        },
      }),
    });
    renderTicket();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel booking' }),
    );

    expect(
      await screen.findByText('Cancellation charge (10%)'),
    ).toBeInTheDocument();
    expect(screen.getByText('− LKR 42')).toBeInTheDocument();
    expect(screen.getByText('− LKR 300')).toBeInTheDocument();
    expect(screen.getByText('LKR 78')).toBeInTheDocument();
    expect(
      screen.getByText('The LKR 100 service fee is not refunded.'),
    ).toBeInTheDocument();
    // Nothing is cancelled until the passenger confirms.
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(
      false,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Yes, cancel booking' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your booking is cancelled. LKR 78 will be refunded',
    );
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel booking' }),
    ).not.toBeInTheDocument();
  });

  it('can be closed without cancelling', async () => {
    mockApi({
      '/bookings/BG-7K2M9QXA/cancellation': quote,
      '/bookings/BG-7K2M9QXA': makeTicket(),
    });
    renderTicket();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel booking' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Keep my booking' }),
    );
    expect(
      screen.getByRole('button', { name: 'Cancel booking' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('offers no cancelling once the bus has left', async () => {
    mockApi({
      '/bookings/BG-7K2M9QXA': makeTicket({ travelDate: '2026-12-01' }),
    });
    renderTicket();
    expect(await screen.findByText('Travelled')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel booking' }),
    ).not.toBeInTheDocument();
  });
});
