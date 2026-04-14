import { config } from 'dotenv';
config({ path: ['.env.local', '.env'] });
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';
import { passkey } from '@better-auth/passkey';
import { twoFactor } from 'better-auth/plugins';

const APP_NAME = 'Kinetic Technical Suite';

if (!process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[auth] BETTER_AUTH_SECRET is not set — check Vercel environment variables');
}

// Build social providers object only for configured providers
const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  basePath: '/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { ...schema },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  plugins: [
    passkey(),
    twoFactor(),
  ],
});
