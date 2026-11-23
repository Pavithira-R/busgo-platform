import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeUser, mockFetch, renderWithProviders } from '../test/render';
import { ProfilePage } from './ProfilePage';

describe('ProfilePage', () => {
  const user = makeUser({ phone: '0771234567', idNumber: null });

  it('shows the account and pre-fills the editable details', () => {
    renderWithProviders(<ProfilePage />, { user });
    expect(screen.getByText('kasun@example.lk')).toBeInTheDocument();
    expect(screen.getByText('Passenger')).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Kasun Perera');
    expect(screen.getByLabelText('Mobile number')).toHaveValue('0771234567');
    // Nothing changed yet, so there is nothing to save.
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('rejects an invalid NIC', async () => {
    renderWithProviders(<ProfilePage />, { user });
    await userEvent.type(screen.getByLabelText('NIC number'), '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(/Enter a valid NIC/)).toBeInTheDocument();
  });

  it('saves changes, clearing an emptied mobile number', async () => {
    const fetchSpy = mockFetch(200, {
      ...user,
      phone: null,
      idNumber: '851234567V',
    });
    renderWithProviders(<ProfilePage />, { user });
    await userEvent.clear(screen.getByLabelText('Mobile number'));
    await userEvent.type(screen.getByLabelText('NIC number'), '851234567v');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your profile has been updated.',
    );
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/auth/me');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({
      fullName: 'Kasun Perera',
      phone: null,
      idNumber: '851234567V',
    });
  });
});
