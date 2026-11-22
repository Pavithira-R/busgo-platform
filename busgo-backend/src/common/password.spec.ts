import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the correct password', async () => {
    const stored = await hashPassword('Secret#123');
    await expect(verifyPassword('Secret#123', stored)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('Secret#123');
    await expect(verifyPassword('secret#123', stored)).resolves.toBe(false);
  });

  it('never stores the plain password and salts each hash', async () => {
    const a = await hashPassword('Secret#123');
    const b = await hashPassword('Secret#123');
    expect(a).not.toContain('Secret#123');
    expect(a).not.toBe(b);
  });

  it('rejects malformed stored values', async () => {
    await expect(verifyPassword('x', 'not-a-hash')).resolves.toBe(false);
  });
});
