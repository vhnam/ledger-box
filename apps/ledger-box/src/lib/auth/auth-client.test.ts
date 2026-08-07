import { describe, expect, it } from 'vite-plus/test';

import { authClient, signIn, signOut, signUp, useSession } from './auth-client';

describe('authClient', () => {
  it('exposes the destructured auth methods as callables', () => {
    expect(typeof signIn).toBe('function');
    expect(typeof signUp).toBe('function');
    expect(typeof signOut).toBe('function');
    expect(typeof useSession).toBe('function');
  });

  it('creates a client instance', () => {
    expect(authClient).toBeDefined();
  });
});
