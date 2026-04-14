import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [
    passkeyClient(),
    twoFactorClient(),
  ],
});

export const { useSession, signIn, signUp, signOut } = authClient;
