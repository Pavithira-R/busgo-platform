import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { makeUser, mockApi, renderWithProviders } from '../test/render';
import AdminRoutes from './AdminRoutes';
import type { Dashboard } from './types';

function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    range: { from: '2026-11-02', to: '2026-12-01' },
    bookings: { total: 12840, confirmed: 11000, used: 900, cancelled: 940 },
    revenue: { grossSales: 6_500_000, refunds: 120_000, netRevenue: 6_380_000 },
    today: { bookedToday: 37, travellingToday: 412 },
    passengers: { total: 5210, newInRange: 830 },
    popularRoutes: [
      {
        routeId: 2,
        routeNumber: '01',
        from: 'Colombo',
        to: 'Kandy',
        departureTime: '08:00',
        operator: 'Ceylon Comfort Lines',
        bookings: 3200,
        revenue: 3_360_000,
      },
    ],
    byOperator: [
      {
        operatorId: 1,
        operator: 'Ceylon Comfort Lines',
        bookings: 5000,
        revenue: 4_000_000,
      },
    ],
    daily: [
      { date: '2026-11-30', bookings: 410, revenue: 205_000 },
      { date: '2026-12-01', bookings: 395, revenue: 198_500 },
    ],
    ...overrides,
  };
}

function renderDashboard(data = makeDashboard(), route = '/admin') {
  const fetchSpy = mockApi({ '/admin/dashboard': data });
  renderWithProviders(
    <Routes>
      <Route path="admin/*" element={<AdminRoutes />} />
    </Routes>,
    { route, user: makeUser({ role: 'admin' }) },
  );
  return fetchSpy;
}

describe('Admin dashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  it('leads with net revenue, then the key numbers', async () => {
    renderDashboard();
    expect(await screen.findByText('LKR 6,380,000')).toBeInTheDocument();
    expect(
      screen.getByText('Gross sales LKR 6,500,000 · Refunds LKR 120,000'),
    ).toBeInTheDocument();
    expect(screen.getByText('12.8K')).toBeInTheDocument(); // bookings
    expect(screen.getByText('940')).toBeInTheDocument(); // cancelled
    expect(screen.getByText('5,210 in total')).toBeInTheDocument();
    expect(screen.getByText('412')).toBeInTheDocument(); // travelling today
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('asks for the last 30 days, and switches period', async () => {
    const fetchSpy = renderDashboard();
    await screen.findByText('LKR 6,380,000');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/admin/dashboard?from=2026-11-02&to=2026-12-01',
      expect.anything(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/admin/dashboard?from=2026-11-25&to=2026-12-01',
      expect.anything(),
    );
  });

  it('offers every chart as a table, and lists top routes', async () => {
    renderDashboard();
    await screen.findByText('LKR 6,380,000');

    const daily = screen
      .getByRole('heading', { name: 'Bookings per day' })
      .closest('div')!;
    await userEvent.click(within(daily).getByText('Show as table'));
    const rows = within(daily).getAllByRole('row');
    expect(rows.map((r) => r.textContent)).toEqual([
      'DateBookings',
      '30 Nov410',
      '1 Dec395',
    ]);

    const top = screen
      .getByRole('heading', { name: 'Top routes' })
      .closest('div')!;
    expect(within(top).getByText('Colombo → Kandy')).toBeInTheDocument();
    expect(
      within(top).getByText('08:00 · Ceylon Comfort Lines'),
    ).toBeInTheDocument();
    expect(within(top).getByText('LKR 3,360,000')).toBeInTheDocument();
  });

  it('says when a period has no bookings', async () => {
    renderDashboard(makeDashboard({ popularRoutes: [], byOperator: [] }));
    expect(
      await screen.findAllByText('No bookings in this period.'),
    ).toHaveLength(2);
  });
});
