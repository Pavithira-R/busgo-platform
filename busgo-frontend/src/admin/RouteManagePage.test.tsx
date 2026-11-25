import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { makeAdminRouteDetails, operators } from '../test/adminFixtures';
import { makeUser, mockApi, renderWithProviders, reply } from '../test/render';
import { RouteManagePage } from './RouteManagePage';

function renderManage(responses: Record<string, unknown> = {}) {
  const route = makeAdminRouteDetails();
  const fetchSpy = mockApi({
    '/admin/operators': operators,
    '/admin/routes/1': route,
    'PATCH /admin/routes/1': route,
    'PUT /admin/routes/1/boarding-points': route,
    'POST /admin/routes/1/cancel-trip': {
      cancelledBookings: 3,
      totalRefunded: 1560,
    },
    ...responses,
  });
  renderWithProviders(
    <Routes>
      <Route path="admin/routes/:id" element={<RouteManagePage />} />
    </Routes>,
    { route: '/admin/routes/1', user: makeUser({ role: 'admin' }) },
  );
  return fetchSpy;
}

function lastBody(fetchSpy: ReturnType<typeof mockApi>, method: string) {
  const call = fetchSpy.mock.calls
    .filter(([, i]) => i?.method === method)
    .at(-1);
  return call ? JSON.parse(String(call[1]?.body)) : undefined;
}

const section = (heading: string) =>
  screen
    .getByRole('heading', { name: heading })
    .closest('div.rounded-2xl') as HTMLElement;

describe('Managing a route', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  it('shows the route and stops selling it after asking', async () => {
    const fetchSpy = renderManage();
    expect(
      await screen.findByRole('heading', { name: 'Colombo → Kandy' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4 upcoming bookings')).toBeInTheDocument();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Stop selling' }));
    expect(lastBody(fetchSpy, 'PATCH')).toEqual({ isActive: false });
  });

  it('saves route details; a cleared bus number is removed', async () => {
    const fetchSpy = renderManage();
    await screen.findByRole('option', { name: 'Ceylon Comfort Lines' });
    const details = section('Route details');
    const fare = within(details).getByLabelText('Fare (LKR)');
    await userEvent.clear(fare);
    await userEvent.type(fare, '450');
    await userEvent.clear(within(details).getByLabelText('Bus number'));
    await userEvent.click(
      within(details).getByRole('button', { name: 'Save' }),
    );

    expect(await screen.findByText('Route details saved.')).toBeInTheDocument();
    expect(lastBody(fetchSpy, 'PATCH')).toEqual({
      routeNumber: '01',
      operatorId: 2,
      serviceType: 'normal',
      departureTime: '06:00',
      arrivalTime: '09:30',
      price: 450,
      busNumber: null,
    });
  });

  it('shows the server explaining why a change is refused', async () => {
    renderManage({
      'PATCH /admin/routes/1': reply(409, {
        message:
          'Cannot change the bus type: 4 upcoming booking(s) have seats on the current layout',
      }),
    });
    await screen.findByRole('option', { name: 'Ceylon Comfort Lines' });
    const details = section('Route details');
    await userEvent.selectOptions(
      within(details).getByLabelText('Bus type'),
      'luxury',
    );
    await userEvent.click(
      within(details).getByRole('button', { name: 'Save' }),
    );
    expect(await within(details).findByRole('alert')).toHaveTextContent(
      'Cannot change the bus type',
    );
  });

  it('edits boarding points in travel order', async () => {
    const fetchSpy = renderManage();
    await screen.findByRole('heading', { name: 'Boarding points' });
    const editor = section('Boarding points');

    await userEvent.click(
      within(editor).getByRole('button', { name: 'Add town' }),
    );
    await userEvent.type(within(editor).getByLabelText('Town 3'), 'Mawanella');
    await userEvent.type(
      within(editor).getByLabelText('Minutes after departure for town 3'),
      '100',
    );
    await userEvent.click(
      within(editor).getByRole('button', { name: 'Save boarding points' }),
    );
    // 100 minutes is before Kegalle (116): out of order.
    expect(
      within(editor).getByText('Must be later than the town before'),
    ).toBeInTheDocument();
    expect(lastBody(fetchSpy, 'PUT')).toBeUndefined();

    await userEvent.click(
      within(editor).getByRole('button', { name: 'Move town 3 up' }),
    );
    expect(within(editor).getByText('07:40')).toBeInTheDocument(); // 06:00 + 100
    await userEvent.click(
      within(editor).getByRole('button', { name: 'Remove town 1' }),
    );
    await userEvent.click(
      within(editor).getByRole('button', { name: 'Save boarding points' }),
    );
    expect(
      await within(editor).findByText('Boarding points saved.'),
    ).toBeInTheDocument();
    expect(lastBody(fetchSpy, 'PUT')).toEqual({
      points: [
        { name: 'Mawanella', minutesFromStart: 100 },
        { id: 4, name: 'Kegalle', minutesFromStart: 116 },
      ],
    });
  });

  it('cancels a trip only after confirming, then reports the refunds', async () => {
    const fetchSpy = renderManage();
    await screen.findByRole('heading', { name: 'Cancel a trip' });
    const form = section('Cancel a trip');

    await userEvent.click(
      within(form).getByRole('button', { name: 'Cancel trip' }),
    );
    expect(within(form).getByRole('alert')).toHaveTextContent(
      'Choose the trip date',
    );

    await userEvent.type(
      within(form).getByLabelText('Trip date'),
      '2026-12-05',
    );
    await userEvent.type(
      within(form).getByLabelText('Reason'),
      'Bus breakdown',
    );
    await userEvent.click(
      within(form).getByRole('button', { name: 'Cancel trip' }),
    );
    expect(
      within(form).getByText(/Cancel the trip on Saturday, 5 December 2026\?/),
    ).toBeInTheDocument();
    expect(lastBody(fetchSpy, 'POST')).toBeUndefined();

    await userEvent.click(
      within(form).getByRole('button', { name: 'Yes, cancel the trip' }),
    );
    expect(await within(form).findByRole('status')).toHaveTextContent(
      'Trip cancelled: 3 bookings refunded (LKR 1,560).',
    );
    expect(lastBody(fetchSpy, 'POST')).toEqual({
      travelDate: '2026-12-05',
      reason: 'Bus breakdown',
    });
  });
});
