import { headers } from 'next/headers';

/**
 * Cookie-forwarding config for server actions calling the Nest API (`API_URL`).
 * Matches the pattern used for onboarding and organization routes.
 */
export async function getServerApiConfig() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const headersList = await headers();
  const cookie = headersList.get('cookie') ?? '';
  return { apiUrl, cookie };
}
