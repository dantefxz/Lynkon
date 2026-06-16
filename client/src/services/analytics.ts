import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST    = 'https://us.i.posthog.com';

let _client: PostHog | null = null;

export function initAnalytics(): PostHog {
  if (!_client) {
    _client = new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST });
  }
  return _client;
}

export function track(event: string, properties?: Record<string, unknown>) {
  try { _client?.capture(event, properties); } catch {}
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  try { _client?.identify(userId, traits); } catch {}
}

export function analyticsReset() {
  try { _client?.reset(); } catch {}
}
