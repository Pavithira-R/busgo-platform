import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../auth/AuthContext';
import { session } from '../lib/session';
import type { User } from '../lib/types';

/** Renders UI with the same providers as the real app, at a given URL. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', user }: { route?: string; user?: User } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (user) {
    session.setToken('test-token');
    queryClient.setQueryData(['me', 'test-token'], user);
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    fullName: 'Kasun Perera',
    email: 'kasun@example.lk',
    phone: '0771234567',
    idNumber: null,
    role: 'passenger',
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Makes fetch return one JSON response. */
export function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

/**
 * Makes fetch answer by API path, e.g. { '/routes/stops': [...] }.
 * The longest matching path wins; anything else is a 404.
 */
export function mockApi(responses: Record<string, unknown>) {
  const paths = Object.keys(responses).sort((a, b) => b.length - a.length);
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    const path = paths.find((p) => url.startsWith(`/api${p}`));
    return new Response(
      JSON.stringify(path ? responses[path] : { message: 'Not found' }),
      {
        status: path ? 200 : 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });
}
