import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { makeRoute, stops } from '../test/fixtures';
import { mockApi, renderWithProviders } from '../test/render';
import { SearchResultsPage } from './SearchResultsPage';

const routes = [
  makeRoute(),
  makeRoute({
    id: 2,
    departureTime: '12:00',
    arrivalTime: '15:00',
    durationMinutes: 180,
    price: 950,
    serviceType: 'luxury',
    operator: { id: 1, name: 'Ceylon Comfort Lines' },
    availableSeats: 3,
  }),
  makeRoute({
    id: 3,
    departureTime: '14:00',
    arrivalTime: '17:15',
    durationMinutes: 195,
    price: 700,
    serviceType: 'semi_luxury',
    availableSeats: 0,
  }),
];

function renderResults(query = '?from=CMB&to=KDY&date=2026-12-01') {
  const fetchSpy = mockApi({ '/routes/stops': stops, '/routes?': routes });
  renderWithProviders(
    <Routes>
      <Route path="search" element={<SearchResultsPage />} />
    </Routes>,
    { route: `/search${query}` },
  );
  return fetchSpy;
}

/** Operator names of the result cards, top to bottom. */
const cards = () =>
  screen
    .getAllByRole('article')
    .map((card) => within(card).getByRole('heading').textContent);

describe('SearchResultsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  it('lists buses with times, fares and seats left', async () => {
    const fetchSpy = renderResults();
    expect(
      await screen.findByRole('heading', { name: 'Colombo to Kandy' }),
    ).toBeInTheDocument();
    await screen.findAllByRole('article');
    expect(screen.getByText(/3 buses/)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/routes?from=CMB&to=KDY&date=2026-12-01',
      expect.anything(),
    );

    const [early, luxury, full] = screen.getAllByRole('article');
    // The 06:00 bus has already left at 10:00; the others have not.
    expect(within(early).getByText('Departed')).toBeInTheDocument();
    expect(
      within(early).getByText('Via Kadawatha, Kegalle'),
    ).toBeInTheDocument();
    expect(within(luxury).getByText('LKR 950')).toBeInTheDocument();
    expect(within(luxury).getByText('Luxury AC')).toBeInTheDocument();
    expect(within(luxury).getByText('3h 0m')).toBeInTheDocument();
    expect(within(luxury).getByText('3 seats left')).toBeInTheDocument();
    expect(within(full).getByText('Sold out')).toBeInTheDocument();
    expect(
      within(luxury).getByRole('link', { name: 'View details' }),
    ).toHaveAttribute('href', '/routes/2?date=2026-12-01');
  });

  it('searches another day from the date strip', async () => {
    const fetchSpy = renderResults();
    await screen.findAllByRole('article');
    const strip = screen.getByRole('group', { name: 'Travel dates' });
    expect(within(strip).getAllByRole('button')).toHaveLength(31);

    await userEvent.click(
      within(strip).getByRole('button', { name: 'Friday 4 December' }),
    );
    expect(
      within(strip).getByRole('button', { name: 'Friday 4 December' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/routes?from=CMB&to=KDY&date=2026-12-04',
      expect.anything(),
    );
    // Nothing has left yet on a later day.
    await screen.findByText(/Friday, 4 December 2026/);
    await screen.findAllByRole('article');
    expect(screen.queryByText('Departed')).not.toBeInTheDocument();
  });

  it('filters by bus type and operator, and sorts by fare', async () => {
    renderResults();
    await screen.findAllByRole('article');

    await userEvent.click(screen.getByRole('button', { name: 'Luxury AC' }));
    expect(cards()).toEqual(['Ceylon Comfort Lines']);

    await userEvent.click(screen.getByRole('button', { name: 'All types' }));
    await userEvent.selectOptions(screen.getByLabelText('Operator'), '2');
    expect(cards()).toEqual(['Hill Country Express', 'Hill Country Express']);

    await userEvent.selectOptions(screen.getByLabelText('Operator'), '');
    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'price');
    expect(
      screen
        .getAllByRole('article')
        .map((card) => within(card).getByText(/^LKR/).textContent),
    ).toEqual(['LKR 420', 'LKR 700', 'LKR 950']);
  });

  it('offers to clear filters that match nothing', async () => {
    renderResults('?from=CMB&to=KDY&date=2026-12-01&type=luxury&operator=2');
    expect(
      await screen.findByText('No buses match these filters.'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('says when no buses run on a route', async () => {
    mockApi({ '/routes/stops': stops, '/routes?': [] });
    renderWithProviders(
      <Routes>
        <Route path="search" element={<SearchResultsPage />} />
      </Routes>,
      { route: '/search?from=GLE&to=KDY&date=2026-12-01' },
    );
    expect(
      await screen.findByText('No buses run between these cities.'),
    ).toBeInTheDocument();
  });

  it('uses today for a date that cannot be booked', async () => {
    const fetchSpy = renderResults('?from=CMB&to=KDY&date=2026-11-01');
    await screen.findAllByRole('article');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/routes?from=CMB&to=KDY&date=2026-12-01',
      expect.anything(),
    );
  });

  it('shows the search form when the trip is missing', async () => {
    mockApi({ '/routes/stops': stops });
    renderWithProviders(
      <Routes>
        <Route path="search" element={<SearchResultsPage />} />
      </Routes>,
      { route: '/search?from=CMB' },
    );
    expect(
      screen.getByText('Choose where you are travelling from and to'),
    ).toBeInTheDocument();
    await screen.findAllByRole('option', { name: 'Colombo' });
    expect(screen.getByLabelText('From')).toHaveValue('CMB');
  });
});
