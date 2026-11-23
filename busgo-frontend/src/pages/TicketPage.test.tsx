import { screen } from '@testing-library/react';
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
