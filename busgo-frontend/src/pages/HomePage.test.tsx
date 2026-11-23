import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { stops } from '../test/fixtures';
import { mockApi, renderWithProviders } from '../test/render';
import { HomePage } from './HomePage';

function SearchUrl() {
  const { search } = useLocation();
  return <p>Searched {search}</p>;
}

function renderHome() {
  mockApi({ '/routes/stops': stops });
  return renderWithProviders(
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="search" element={<SearchUrl />} />
    </Routes>,
  );
}

describe('HomePage search', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  it('asks for both cities, and different ones', async () => {
    renderHome();
    await screen.findAllByRole('option', { name: 'Kandy' });
    const search = screen.getByRole('button', { name: 'Search buses' });

    await userEvent.click(search);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose where you are travelling from and to',
    );

    await userEvent.selectOptions(screen.getByLabelText('From'), 'KDY');
    await userEvent.selectOptions(screen.getByLabelText('To'), 'KDY');
    await userEvent.click(search);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'From and To must be different',
    );
  });

  it('opens the results for the chosen trip, after swapping', async () => {
    renderHome();
    await screen.findAllByRole('option', { name: 'Kandy' });
    expect(screen.getByLabelText('Travel date')).toHaveValue('2026-12-01');

    await userEvent.selectOptions(screen.getByLabelText('From'), 'KDY');
    await userEvent.selectOptions(screen.getByLabelText('To'), 'CMB');
    await userEvent.click(
      screen.getByRole('button', { name: 'Swap From and To' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Search buses' }));

    expect(
      screen.getByText('Searched ?from=CMB&to=KDY&date=2026-12-01'),
    ).toBeInTheDocument();
  });

  it('links to popular routes for today', async () => {
    renderHome();
    expect(
      await screen.findByRole('link', { name: 'Colombo → Kandy' }),
    ).toHaveAttribute('href', '/search?from=CMB&to=KDY&date=2026-12-01');
  });
});
