import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { routeDetails } from '../test/fixtures';
import { mockApi, renderWithProviders } from '../test/render';
import { RouteDetailsPage } from './RouteDetailsPage';

function renderDetails(path: string, seatsFree = 47) {
  mockApi({
    '/routes/1/seats': { availableSeats: seatsFree, totalSeats: 50 },
    '/routes/1': routeDetails,
  });
  renderWithProviders(
    <Routes>
      <Route path="routes/:id" element={<RouteDetailsPage />} />
    </Routes>,
    { route: path },
  );
}

describe('RouteDetailsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  it('shows the stops in order, the price and free seats', async () => {
    renderDetails('/routes/1?date=2026-12-03');

    expect(
      await screen.findByRole('heading', { name: 'Hill Country Express' }),
    ).toBeInTheDocument();
    const stops = screen
      .getAllByRole('listitem')
      .slice(0, 4)
      .map((li) => li.textContent);
    expect(stops).toEqual([
      '06:00Colombo Central Bus StandDeparts',
      '06:25Kadawatha',
      '07:56Kegalle',
      '09:30Kandy Goods Shed Bus StandArrives',
    ]);
    expect(screen.getByText('Thursday, 3 December 2026')).toBeInTheDocument();
    expect(await screen.findByText('47 of 50 seats free')).toBeInTheDocument();
    expect(screen.getByText('LKR 520')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Back to results/ }),
    ).toHaveAttribute('href', '/search?from=CMB&to=KDY&date=2026-12-03');
  });

  it('marks a bus that has already left today', async () => {
    renderDetails('/routes/1?date=2026-12-01');
    expect(await screen.findByText('Departed')).toBeInTheDocument();
    expect(screen.queryByText(/seats free/)).not.toBeInTheDocument();
  });

  it('explains when the bus does not exist', async () => {
    mockApi({});
    renderWithProviders(
      <Routes>
        <Route path="routes/:id" element={<RouteDetailsPage />} />
      </Routes>,
      { route: '/routes/99' },
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This bus could not be found',
    );
  });
});
