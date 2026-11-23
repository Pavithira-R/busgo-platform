import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { makeTicket, routeDetails, seatMap } from '../test/fixtures';
import { makeUser, mockApi, renderWithProviders, reply } from '../test/render';
import { BookingPage } from './BookingPage';

function renderBooking(postReply: unknown, path = '/book/1?date=2026-12-03') {
  const fetchSpy = mockApi({
    '/routes/1/seats': seatMap,
    '/routes/1': routeDetails,
    'POST /bookings': postReply,
  });
  renderWithProviders(
    <Routes>
      <Route path="book/:id" element={<BookingPage />} />
      <Route path="tickets/:ticketId" element={<p>Ticket page</p>} />
    </Routes>,
    { route: path, user: makeUser() },
  );
  return fetchSpy;
}

const click = (name: string | RegExp) =>
  userEvent.click(screen.getByRole('button', { name }));

describe('BookingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  it('books a seat: seat, boarding town, passenger, payment', async () => {
    const fetchSpy = renderBooking(makeTicket());

    // Step 1: A1 is taken; pick A2 and board at Kegalle.
    expect(
      await screen.findByRole('button', { name: 'Seat A1, booked' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Choose a seat to continue' }),
    ).toBeDisabled();
    await click('Seat A2');
    expect(screen.getByRole('button', { name: 'Seat A2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Where will you board?'),
      'Kegalle, about 07:56',
    );
    expect(screen.getByText('Kegalle, 07:56')).toBeInTheDocument();
    expect(screen.getByText('LKR 520')).toBeInTheDocument();
    await click('Continue with seat A2');

    // Step 2: filled in from the profile.
    expect(screen.getByLabelText('Passenger name')).toHaveValue('Kasun Perera');
    expect(screen.getByLabelText('Email')).toHaveValue('kasun@example.lk');
    expect(screen.getByLabelText('Mobile number')).toHaveValue('0771234567');
    await click('Continue');

    // Step 3: card details are checked before paying.
    await click('Pay LKR 520');
    expect(
      await screen.findByText('Enter a valid 16-digit card number'),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText('Card number'),
      '4111 1111 1111 1111',
    );
    await userEvent.type(screen.getByLabelText('Expiry (MM/YY)'), '08/28');
    await userEvent.type(screen.getByLabelText('CVV'), '123');
    await click('Pay LKR 520');

    expect(await screen.findByText('Ticket page')).toBeInTheDocument();
    const post = fetchSpy.mock.calls.find(
      ([, init]) => init?.method === 'POST',
    );
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      routeId: 1,
      travelDate: '2026-12-03',
      seatNumber: 'A2',
      boardingPointId: 4,
      passengerName: 'Kasun Perera',
      passengerEmail: 'kasun@example.lk',
      passengerPhone: '0771234567',
      paymentMethod: 'card',
    });
  });

  it('pays with eZ Cash using the passenger mobile', async () => {
    const fetchSpy = renderBooking(makeTicket({ paymentMethod: 'ez_cash' }));
    await screen.findByRole('button', { name: 'Seat B4' });
    await click('Seat B4');
    await click('Continue with seat B4');
    await click('Continue');
    await userEvent.click(screen.getByLabelText('eZ Cash'));
    expect(screen.getByLabelText('eZ Cash mobile number')).toHaveValue(
      '0771234567',
    );
    await click('Pay LKR 520');

    await screen.findByText('Ticket page');
    const post = fetchSpy.mock.calls.find(
      ([, init]) => init?.method === 'POST',
    );
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
      seatNumber: 'B4',
      paymentMethod: 'ez_cash',
    });
    expect(JSON.parse(String(post?.[1]?.body))).not.toHaveProperty(
      'boardingPointId',
    );
  });

  it('asks for another seat when someone else just took it', async () => {
    renderBooking(
      reply(409, { message: 'Seat A2 is already booked for this trip' }),
    );
    await screen.findByRole('button', { name: 'Seat A2' });
    await click('Seat A2');
    await click('Continue with seat A2');
    await click('Continue');
    await userEvent.click(screen.getByLabelText('Bank transfer'));
    await click('Pay LKR 520');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'seat A2 was just booked by someone else',
    );
    expect(
      screen.getByRole('button', { name: 'Choose a seat to continue' }),
    ).toBeDisabled();
    expect(
      within(screen.getByRole('list')).getByText('Seat').closest('li'),
    ).toHaveAttribute('aria-current', 'step');
  });

  it('refuses dates that cannot be booked', async () => {
    renderBooking(makeTicket(), '/book/1?date=2026-11-20');
    expect(
      await screen.findByText(
        'This bus can no longer be booked for this date.',
      ),
    ).toBeInTheDocument();
  });

  it('refuses a bus that has already left today', async () => {
    renderBooking(makeTicket(), '/book/1?date=2026-12-01');
    expect(
      await screen.findByText(
        'This bus can no longer be booked for this date.',
      ),
    ).toBeInTheDocument();
  });
});
