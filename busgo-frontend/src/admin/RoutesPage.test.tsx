import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router';
import {
  makeAdminRoute,
  makeAdminRouteDetails,
  operators,
} from '../test/adminFixtures';
import { stops } from '../test/fixtures';
import { makeUser, mockApi, renderWithProviders } from '../test/render';
import { NewRoutePage, RoutesPage } from './RoutesPage';

function ManagePage() {
  return <p>Managing route {useParams().id}</p>;
}

function renderAt(route: string) {
  const fetchSpy = mockApi({
    '/admin/operators': operators,
    '/routes/stops': stops,
    '/admin/routes': [
      makeAdminRoute(),
      makeAdminRoute({
        id: 2,
        departureTime: '22:00',
        arrivalTime: '05:30',
        isActive: false,
      }),
    ],
    'POST /admin/routes': makeAdminRouteDetails({ id: 17 }),
  });
  renderWithProviders(
    <Routes>
      <Route path="admin/routes" element={<RoutesPage />} />
      <Route path="admin/routes/new" element={<NewRoutePage />} />
      <Route path="admin/routes/:id" element={<ManagePage />} />
    </Routes>,
    { route, user: makeUser({ role: 'admin' }) },
  );
  return fetchSpy;
}

describe('Admin routes list', () => {
  it('lists routes, on sale or not, and filters by operator', async () => {
    const fetchSpy = renderAt('/admin/routes');
    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2 routes
    expect(within(rows[1]).getByText('06:00 – 09:30')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Active')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Inactive')).toBeInTheDocument();
    expect(
      within(rows[1]).getByRole('link', { name: /Manage Colombo/ }),
    ).toHaveAttribute('href', '/admin/routes/1');

    await screen.findByRole('option', { name: 'Hill Country Express' });
    await userEvent.selectOptions(screen.getByLabelText('Operator'), '2');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/admin/routes?operatorId=2',
      expect.anything(),
    );
  });
});

describe('Adding a route', () => {
  it('checks the form, creates the route and opens it', async () => {
    const fetchSpy = renderAt('/admin/routes/new');
    await screen.findAllByRole('option', {
      name: 'Kandy Goods Shed Bus Stand',
    });
    // Deactivated operators can't take new routes.
    expect(
      screen.queryByRole('option', { name: 'Hill Country Express' }),
    ).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('From'), 'CMB');
    await userEvent.selectOptions(screen.getByLabelText('To'), 'CMB');
    await userEvent.click(screen.getByRole('button', { name: 'Create route' }));
    expect(
      await screen.findByText('From and To must be different'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enter a fare between 1 and 100,000'),
    ).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('To'), 'GLE');
    await userEvent.selectOptions(screen.getByLabelText('Operator'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Bus type'), 'luxury');
    await userEvent.type(screen.getByLabelText('Route number'), '02');
    await userEvent.type(screen.getByLabelText('Bus number'), 'nc-2020');
    await userEvent.type(screen.getByLabelText('Departs'), '07:15');
    await userEvent.type(screen.getByLabelText('Arrives'), '09:45');
    await userEvent.type(screen.getByLabelText('Fare (LKR)'), '780');
    await userEvent.click(screen.getByRole('button', { name: 'Create route' }));

    expect(await screen.findByText('Managing route 17')).toBeInTheDocument();
    const post = fetchSpy.mock.calls.find(([, i]) => i?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      fromCode: 'CMB',
      toCode: 'GLE',
      operatorId: 1,
      serviceType: 'luxury',
      routeNumber: '02',
      busNumber: 'NC-2020',
      departureTime: '07:15',
      arrivalTime: '09:45',
      price: 780,
    });
  });
});
