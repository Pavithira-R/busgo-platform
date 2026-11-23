import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { makeUser, renderWithProviders } from '../test/render';
import { Layout } from './Layout';

function renderLayout(user?: ReturnType<typeof makeUser>) {
  return renderWithProviders(
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<p>Home content</p>} />
      </Route>
    </Routes>,
    { user },
  );
}

const mainNav = () =>
  within(screen.getAllByRole('navigation', { name: 'Main' })[0]);

describe('Layout', () => {
  it('shows log in and sign up to guests', () => {
    renderLayout();
    expect(mainNav().getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(
      mainNav().getByRole('link', { name: 'Sign up' }),
    ).toBeInTheDocument();
    expect(mainNav().queryByRole('link', { name: 'My bookings' })).toBeNull();
    expect(screen.getByText('Home content')).toBeInTheDocument();
  });

  it('shows my bookings and log out to passengers, but not admin', () => {
    renderLayout(makeUser());
    expect(
      mainNav().getByRole('link', { name: 'My bookings' }),
    ).toBeInTheDocument();
    expect(
      mainNav().getByRole('button', { name: 'Log out' }),
    ).toBeInTheDocument();
    expect(mainNav().queryByRole('link', { name: 'Admin' })).toBeNull();
  });

  it('shows the admin link to admins', () => {
    renderLayout(makeUser({ role: 'admin' }));
    expect(mainNav().getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('logs out', async () => {
    renderLayout(makeUser());
    await userEvent.click(mainNav().getByRole('button', { name: 'Log out' }));
    expect(mainNav().getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });

  it('opens the mobile menu', async () => {
    renderLayout();
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(2);
  });
});
