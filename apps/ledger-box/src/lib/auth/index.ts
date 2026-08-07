/**
 * Browser-safe auth surface only.
 *
 * Server `auth` (constructs a `pg` Pool and reads secrets) must be imported from
 * `#/lib/auth/auth` in Netlify handlers — never from this barrel — so a mistaken
 * `#/lib/auth` import cannot pull server side effects into the Vite bundle.
 */
export { authClient, signIn, signUp, signOut, useSession } from './auth-client';
