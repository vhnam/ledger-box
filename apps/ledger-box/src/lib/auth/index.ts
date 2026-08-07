/**
 * `./auth` is server-only (constructs a `pg` Pool and reads server secrets) and `./auth-client`
 * is safe for the browser bundle. Both are re-exported here for convenience, but import the
 * specific submodule directly (not this barrel) from client-bundled code, since a barrel import
 * pulls in `./auth`'s top-level side effects regardless of which export is used.
 */
export { auth } from './auth';
export { authClient, signIn, signUp, signOut, useSession } from './auth-client';
