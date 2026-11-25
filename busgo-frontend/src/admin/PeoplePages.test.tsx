import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { operators } from '../test/adminFixtures';
import { makeTicket } from '../test/fixtures';
import { makeUser, mockApi, renderWithProviders } from '../test/render';
import AdminRoutes from './AdminRoutes';
import type { AdminPassenger, StaffMember } from './types';

const admin = makeUser({ id: 1, role: 'admin', fullName: 'Admin User' });

function renderAdmin(route: string, responses: Record<string, unknown>) {
  const fetchSpy = mockApi({ '/admin/operators': operators, ...responses });
  renderWithProviders(
    <Routes>
      <Route path="admin/*" element={<AdminRoutes />} />
    </Routes>,
    { route, user: admin },
  );
  return fetchSpy;
}

const urls = (fetchSpy: ReturnType<typeof mockApi>, prefix: string) =>
  fetchSpy.mock.calls
    .map(([u]) => String(u))
    .filter((u) => u.startsWith(prefix));

describe('Admin bookings', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T04:30:00Z')); // 10:00 in Sri Lanka
  });
  afterEach(() => vi.useRealTimers());

  const page = (count: number, total: number, pageNo = 1) => ({
    items: Array.from({ length: count }, (_, i) =>
      makeTicket({ ticketId: `BG-TEST000${i}` }),
    ),
    total,
    page: pageNo,
    limit: 20,
  });

  it('lists bookings with links to each ticket', async () => {
    renderAdmin('/admin/bookings', { '/admin/bookings': page(2, 2) });
    const link = await screen.findByRole('link', { name: 'BG-TEST0000' });
    expect(link).toHaveAttribute('href', '/tickets/BG-TEST0000');
    const row = link.closest('tr')!;
    expect(within(row).getByText('Kasun Perera')).toBeInTheDocument();
    expect(within(row).getByText('Colombo → Kandy')).toBeInTheDocument();
    expect(within(row).getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('1–2 of 2')).toBeInTheDocument();
  });

  it('filters by search, status and operator, and pages through', async () => {
    const fetchSpy = renderAdmin('/admin/bookings', {
      '/admin/bookings': page(20, 45),
    });
    await screen.findByRole('link', { name: 'BG-TEST0000' });

    // One character is too short to search: it is ignored.
    await userEvent.type(screen.getByRole('searchbox'), 'k{Enter}');
    expect(urls(fetchSpy, '/api/admin/bookings').at(-1)).toBe(
      '/api/admin/bookings?page=1&limit=20',
    );

    await userEvent.type(screen.getByRole('searchbox'), 'asun{Enter}');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'cancelled');
    await userEvent.selectOptions(screen.getByLabelText('Operator'), '1');
    expect(urls(fetchSpy, '/api/admin/bookings').at(-1)).toBe(
      '/api/admin/bookings?search=kasun&status=cancelled&operatorId=1&page=1&limit=20',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(urls(fetchSpy, '/api/admin/bookings').at(-1)).toContain('page=2');

    // Changing a filter starts again from page 1.
    await userEvent.selectOptions(screen.getByLabelText('Status'), '');
    expect(urls(fetchSpy, '/api/admin/bookings').at(-1)).toBe(
      '/api/admin/bookings?search=kasun&operatorId=1&page=1&limit=20',
    );
  });
});

describe('Admin passengers', () => {
  const passenger: AdminPassenger = {
    id: 3,
    fullName: 'Nimali Silva',
    email: 'nimali@example.lk',
    phone: '0771112233',
    isActive: true,
    // 20:00 UTC on 30 Nov is already 1 December in Sri Lanka.
    createdAt: '2026-11-30T20:00:00.000Z',
    bookings: 5,
    lastBookedAt: '2026-11-23 22:10:08.860176+05:30',
  };

  it('shows passengers with Sri Lankan dates and deactivates after asking', async () => {
    const fetchSpy = renderAdmin('/admin/passengers', {
      '/admin/passengers': { items: [passenger], total: 1, page: 1, limit: 20 },
      'PATCH /admin/users/3/status': { ...passenger, isActive: false },
    });
    const row = (await screen.findByText('Nimali Silva')).closest('tr')!;
    expect(within(row).getByText('1 Dec 2026')).toBeInTheDocument();
    expect(within(row).getByText('23 Nov 2026')).toBeInTheDocument();
    expect(within(row).getByText('5')).toBeInTheDocument();

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await userEvent.click(
      within(row).getByRole('button', { name: 'Deactivate Nimali Silva' }),
    );
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('signed out'));
    const patch = fetchSpy.mock.calls.find(([, i]) => i?.method === 'PATCH');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ isActive: false });
  });

  it('searches by name, email or phone', async () => {
    const fetchSpy = renderAdmin('/admin/passengers', {
      '/admin/passengers': { items: [], total: 0, page: 1, limit: 20 },
    });
    expect(await screen.findByText('No passengers match.')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), '077{Enter}');
    expect(urls(fetchSpy, '/api/admin/passengers').at(-1)).toBe(
      '/api/admin/passengers?search=077&page=1&limit=20',
    );
  });
});

describe('Admin staff', () => {
  const staff: StaffMember[] = [
    {
      id: 1,
      fullName: 'Admin User',
      email: 'admin@busgo.lk',
      phone: null,
      role: 'admin',
      isActive: true,
      createdAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 2,
      fullName: 'Gate Staff',
      email: 'staff@busgo.lk',
      phone: null,
      role: 'staff',
      isActive: false,
      createdAt: '2026-11-01T00:00:00.000Z',
    },
  ];

  it('only lets staff accounts be switched on or off', async () => {
    renderAdmin('/admin/staff', { '/admin/staff': staff });
    const adminRow = (await screen.findByText('admin@busgo.lk')).closest('tr')!;
    expect(within(adminRow).getByText('Administrator')).toBeInTheDocument();
    expect(within(adminRow).queryByRole('button')).not.toBeInTheDocument();
    const staffRow = screen.getByText('staff@busgo.lk').closest('tr')!;
    expect(
      within(staffRow).getByRole('button', { name: 'Activate Gate Staff' }),
    ).toBeInTheDocument();
  });

  it('creates a gate staff account', async () => {
    const fetchSpy = renderAdmin('/admin/staff', {
      '/admin/staff': staff,
      'POST /admin/staff': { ...staff[1], id: 9, email: 'ruwan@busgo.lk' },
    });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Add gate staff' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );
    expect(
      await screen.findByText('Enter at least 2 characters'),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText('Full name'),
      'Ruwan Jayasinghe',
    );
    await userEvent.type(screen.getByLabelText('Email'), 'ruwan@busgo.lk');
    await userEvent.type(
      screen.getByLabelText('Temporary password'),
      'Gate@2026',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Account created for ruwan@busgo.lk',
    );
    const post = fetchSpy.mock.calls.find(([, i]) => i?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      fullName: 'Ruwan Jayasinghe',
      email: 'ruwan@busgo.lk',
      password: 'Gate@2026',
    });
  });
});
