import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { makeUser, renderWithProviders } from '../test/render';
import { RequireAuth } from './RequireAuth';

function renderGuarded(user?: ReturnType<typeof makeUser>) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/admin"
        element={
          <RequireAuth roles={['admin']}>
            <p>Secret admin page</p>
          </RequireAuth>
        }
      />
      <Route path="/login" element={<p>Login page</p>} />
    </Routes>,
    { route: '/admin', user },
  );
}

describe('RequireAuth', () => {
  it('sends guests to the login page', () => {
    renderGuarded();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('blocks users without the right role', () => {
    renderGuarded(makeUser({ role: 'passenger' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      "You don't have access",
    );
    expect(screen.queryByText('Secret admin page')).toBeNull();
  });

  it('shows the page to users with the right role', () => {
    renderGuarded(makeUser({ role: 'admin' }));
    expect(screen.getByText('Secret admin page')).toBeInTheDocument();
  });
});
