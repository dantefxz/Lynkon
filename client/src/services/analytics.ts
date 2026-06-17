// import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST    = 'https://us.i.posthog.com';

let _client: any = null;

export function initAnalytics(): any {
  console.log('Analytics disabled for build compatibility');
  return null;
}

export function track(event: string, properties?: Record<string, unknown>) {
  // try { _client?.capture(event, properties); } catch {}
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  // try { _client?.identify(userId, traits); } catch {}
}

export function analyticsReset() {
  // try { _client?.reset(); } catch {}
}