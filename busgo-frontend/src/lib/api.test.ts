import { mockFetch } from '../test/render';
import { api, ApiError } from './api';
import { session } from './session';

describe('api', () => {
  it('calls the backend under /api and returns the JSON', async () => {
    const fetchSpy = mockFetch(200, { status: 'ok' });
    await expect(api('/health')).resolves.toEqual({ status: 'ok' });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends the login token and JSON bodies', async () => {
    session.setToken('abc123');
    const fetchSpy = mockFetch(201, {});
    await api('/bookings', { method: 'POST', body: { seatNumber: 'A1' } });
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer abc123',
      'Content-Type': 'application/json',
    });
    expect(init?.body).toBe('{"seatNumber":"A1"}');
  });

  it('turns validation errors into a readable ApiError', async () => {
    mockFetch(400, {
      statusCode: 400,
      message: ['email: Invalid email address', 'password: Too short'],
    });
    const error = await api('/auth/register').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      details: ['email: Invalid email address', 'password: Too short'],
      message: 'email: Invalid email address\npassword: Too short',
    });
  });

  it('signs out when the server rejects the login token', async () => {
    session.setToken('expired');
    mockFetch(401, { message: 'Unauthorized' });
    await expect(api('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(session.getToken()).toBeNull();
  });

  it('explains when the server cannot be reached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
    await expect(api('/health')).rejects.toMatchObject({
      status: 0,
      message: 'Cannot reach BusGo. Check your connection.',
    });
  });
});
