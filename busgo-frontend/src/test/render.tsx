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

const REPLY = Symbol('reply');

/** A response with a status other than 200, for {@link mockApi}. */
export function reply(status: number, body: unknown) {
  return { [REPLY]: true, status, body };
}

/**
 * Makes fetch answer by API path, e.g. { '/routes/stops': [...] }.
 * Prefix a path with a method for other requests: { 'POST /bookings': ... }.
 * The longest matching path wins; anything else is a 404.
 */
export function mockApi(responses: Record<string, unknown>) {
  const keys = Object.keys(responses).sort((a, b) => b.length - a.length);
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const method = init?.method ?? 'GET';
      const url = String(input);
      const key = keys.find((k) => {
        const [m, path] = k.includes(' ') ? k.split(' ') : ['GET', k];
        return m === method && url.startsWith(`/api${path}`);
      });
      const value = key ? responses[key] : reply(404, { message: 'Not found' });
      const { status, body } =
        value && typeof value === 'object' && REPLY in value
          ? (value as unknown as { status: number; body: unknown })
          : { status: 200, body: value };
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    });
}
