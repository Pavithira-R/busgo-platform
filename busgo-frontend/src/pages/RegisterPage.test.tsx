import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { session } from '../lib/session';
import { makeUser, mockFetch, renderWithProviders } from '../test/render';
import { RegisterPage } from './RegisterPage';

function renderRegister() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<p>Home page</p>} />
    </Routes>,
    { route: '/register' },
  );
}

async function fill(fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    await userEvent.type(screen.getByLabelText(label), value);
  }
}

describe('RegisterPage', () => {
  it('checks the details before calling the server', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderRegister();
    await fill({
      'Full name': 'K',
      Email: 'not-an-email',
      'Mobile number': '0112345678',
      Password: 'short',
      'Confirm password': 'different',
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(
      await screen.findByText('Enter at least 2 characters'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText(/Sri Lankan mobile number/)).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('creates the account with a normalised mobile number and signs in', async () => {
    const fetchSpy = mockFetch(201, {
      accessToken: 'fresh',
      expiresIn: 3600,
      user: makeUser(),
    });
    renderRegister();
    await fill({
      'Full name': 'Kasun Perera',
      Email: 'kasun@example.lk',
      'Mobile number': '+94 77 123 4567',
      Password: 'Passw0rd!',
      'Confirm password': 'Passw0rd!',
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(session.getToken()).toBe('fresh');
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      fullName: 'Kasun Perera',
      email: 'kasun@example.lk',
      phone: '0771234567',
      password: 'Passw0rd!',
    });
  });

  it('leaves out an empty mobile number', async () => {
    const fetchSpy = mockFetch(201, {
      accessToken: 't',
      expiresIn: 1,
      user: makeUser(),
    });
    renderRegister();
    await fill({
      'Full name': 'Kasun Perera',
      Email: 'kasun@example.lk',
      Password: 'Passw0rd!',
      'Confirm password': 'Passw0rd!',
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );
    await screen.findByText('Home page');
    expect(
      JSON.parse(String(fetchSpy.mock.calls[0][1]?.body)),
    ).not.toHaveProperty('phone');
  });

  it('shows when the email is already registered', async () => {
    mockFetch(409, { message: 'Email is already registered' });
    renderRegister();
    await fill({
      'Full name': 'Kasun Perera',
      Email: 'kasun@example.lk',
      Password: 'Passw0rd!',
      'Confirm password': 'Passw0rd!',
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This email is already registered. Try logging in.',
    );
  });
});
