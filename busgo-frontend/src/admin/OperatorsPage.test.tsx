import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { operators } from '../test/adminFixtures';
import { makeUser, mockApi, renderWithProviders } from '../test/render';
import AdminRoutes from './AdminRoutes';

function renderOperators() {
  const fetchSpy = mockApi({
    '/admin/operators': operators,
    'POST /admin/operators': operators[0],
    'PATCH /admin/operators/': operators[0],
  });
  renderWithProviders(
    <Routes>
      <Route path="admin/*" element={<AdminRoutes />} />
    </Routes>,
    { route: '/admin/operators', user: makeUser({ role: 'admin' }) },
  );
  return fetchSpy;
}

/** The body of the last request with this method. */
function sent(fetchSpy: ReturnType<typeof mockApi>, method: string) {
  const call = fetchSpy.mock.calls
    .filter(([, i]) => i?.method === method)
    .at(-1);
  return { url: String(call?.[0]), body: JSON.parse(String(call?.[1]?.body)) };
}

describe('Admin operators', () => {
  it('lists operators with their status', async () => {
    renderOperators();
    const row = (await screen.findByText('Ceylon Comfort Lines')).closest(
      'tr',
    )!;
    expect(within(row).getByText('0112345601')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
    const other = screen.getByText('Hill Country Express').closest('tr')!;
    expect(within(other).getByText('Inactive')).toBeInTheDocument();
    expect(
      within(other).getByRole('button', {
        name: 'Activate Hill Country Express',
      }),
    ).toBeInTheDocument();
  });

  it('adds an operator, checking the phone number', async () => {
    const fetchSpy = renderOperators();
    await screen.findByText('Ceylon Comfort Lines');
    await userEvent.click(screen.getByRole('button', { name: 'Add operator' }));

    await userEvent.type(screen.getByLabelText('Operator name'), 'Lanka Star');
    await userEvent.type(screen.getByLabelText('Phone'), '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText(/Enter a 10-digit phone number/),
    ).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Phone'));
    await userEvent.type(screen.getByLabelText('Phone'), '081 222 3344');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByRole('button', { name: 'Add operator' });
    expect(sent(fetchSpy, 'POST')).toEqual({
      url: '/api/admin/operators',
      body: { name: 'Lanka Star', phone: '0812223344' },
    });
  });

  it('edits an operator name', async () => {
    const fetchSpy = renderOperators();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Edit Ceylon Comfort Lines' }),
    );
    const name = screen.getByLabelText('Operator name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Ceylon Comfort Coaches');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByRole('button', { name: 'Edit Ceylon Comfort Lines' });
    expect(sent(fetchSpy, 'PATCH')).toEqual({
      url: '/api/admin/operators/1',
      body: { name: 'Ceylon Comfort Coaches', phone: '0112345601' },
    });
  });

  it('asks before deactivating an operator', async () => {
    const fetchSpy = renderOperators();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const button = await screen.findByRole('button', {
      name: 'Deactivate Ceylon Comfort Lines',
    });

    await userEvent.click(button);
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('stop appearing in search'),
    );
    expect(fetchSpy.mock.calls.some(([, i]) => i?.method === 'PATCH')).toBe(
      false,
    );

    confirm.mockReturnValue(true);
    await userEvent.click(button);
    expect(sent(fetchSpy, 'PATCH')).toEqual({
      url: '/api/admin/operators/1',
      body: { isActive: false },
    });
  });
});
