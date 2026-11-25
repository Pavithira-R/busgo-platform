import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { GuestOnly } from '../auth/GuestOnly';
import { session } from '../lib/session';
import { makeUser, mockFetch, renderWithProviders } from '../test/render';
import { LoginPage } from './LoginPage';

function renderLogin(user?: ReturnType<typeof makeUser>) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route path="/" element={<p>Home page</p>} />
    </Routes>,
    { route: '/login', user },
  );
}

describe('LoginPage', () => {
  it('asks for an email and password before calling the server', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findAllByText('This field is required')).toHaveLength(
      2,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('logs in and goes to the home page', async () => {
    const fetchSpy = mockFetch(200, {
      accessToken: 'new-token',
      expiresIn: 3600,
      user: makeUser(),
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'kasun@example.lk');
    await userEvent.type(screen.getByLabelText('Password'), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(session.getToken()).toBe('new-token');
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      email: 'kasun@example.lk',
      password: 'Passw0rd!',
    });
  });

  it('explains a wrong password in plain words', async () => {
    mockFetch(401, { message: 'Invalid email or password' });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'kasun@example.lk');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incorrect email or password.',
    );
  });

  it('sends signed-in users away from the login page', () => {
    renderLogin(makeUser());
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });
});
