// ==============================================================================
// 🚀 CLIENT REAL-TIME REACTIVE CACHE & CROSS-TAB SYNC ENGINE
// ==============================================================================
// Provides instantaneous state synchronization across all components and open tabs:
// - Real-time Counter Open/Close status updates (0ms local dispatch + auto background sync)
// - Instant Website Content CMS propagation (Services, Pricing, FAQs, Equipment)
// - Instant Cross-Tab Login & Logout synchronization
// - Instant Community Announcements updates
// ==============================================================================

export interface WebsiteContentData {
  heroTitle?: string;
  heroSubtitle?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  mapsUrl?: string;
  operatorName?: string;
  operatorBio?: string;
  servicesList?: Array<{
    id: string;
    name: string;
    category: string;
    description?: string;
    isClosed?: boolean;
    price?: string;
  }>;
  equipmentList?: Array<{
    id: string;
    title: string;
    description: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
  }>;
  faqs?: Array<{
    q: string;
    a: string;
  }>;
  [key: string]: any;
}

export interface CounterStatusData {
  isOpen: boolean;
  reason?: string;
  statusText?: string;
  updatedAt?: string;
}

// ------------------------------------------------------------------------------
// 1. Cross-Tab Communication Channel
// ------------------------------------------------------------------------------
const CHANNEL_NAME = 'atalseva_realtime_sync_v1';
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

// ------------------------------------------------------------------------------
// 2. In-Memory Caches
// ------------------------------------------------------------------------------
let websiteContentCache: WebsiteContentData | null = null;
let websiteContentCacheTime = 0;
let websiteContentInFlight: Promise<WebsiteContentData | null> | null = null;
const CONTENT_TTL_MS = 60 * 1000; // 60 seconds

let counterStatusCache: CounterStatusData | null = null;
let counterStatusCacheTime = 0;
let counterStatusInFlight: Promise<CounterStatusData> | null = null;
const COUNTER_TTL_MS = 15 * 1000; // 15 seconds

// ------------------------------------------------------------------------------
// 3. Website Content Fetching & Reactive Subscriptions
// ------------------------------------------------------------------------------

export async function getCachedWebsiteContent(forceRefresh = false): Promise<WebsiteContentData | null> {
  const now = Date.now();

  if (!forceRefresh && websiteContentCache && (now - websiteContentCacheTime < CONTENT_TTL_MS)) {
    return websiteContentCache;
  }

  if (websiteContentInFlight && !forceRefresh) {
    return websiteContentInFlight;
  }

  websiteContentInFlight = (async () => {
    try {
      const res = await fetch('/api/website-content');
      if (res.ok) {
        const data = await res.json();
        if (data?.content) {
          websiteContentCache = data.content;
          websiteContentCacheTime = Date.now();
          try {
            localStorage.setItem('mv_website_content', JSON.stringify(data.content));
          } catch {}
          return data.content;
        }
      }
    } catch {
      // Network failed or offline: fall through to localStorage
    } finally {
      websiteContentInFlight = null;
    }

    try {
      const local = localStorage.getItem('mv_website_content');
      if (local) {
        const parsed = JSON.parse(local);
        websiteContentCache = parsed;
        return parsed;
      }
    } catch {}

    return null;
  })();

  return websiteContentInFlight;
}

/**
 * Invalidates and instantly notifies all subscribers across this tab and other tabs that content changed.
 */
export function invalidateWebsiteContentCache(newContent?: WebsiteContentData): void {
  if (newContent) {
    websiteContentCache = newContent;
    websiteContentCacheTime = Date.now();
    try {
      localStorage.setItem('mv_website_content', JSON.stringify(newContent));
      localStorage.setItem('mv_website_content_sync_ts', String(Date.now()));
    } catch {}
  } else {
    websiteContentCache = null;
    websiteContentCacheTime = 0;
  }
  websiteContentInFlight = null;

  // Local window event dispatch (0ms)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atalseva:content-updated', { detail: newContent }));
  }

  // Cross-tab broadcast
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CONTENT_UPDATED', payload: newContent });
    } catch {}
  }
}

/**
 * Subscribes a component to instant website content updates.
 */
export function subscribeToWebsiteContent(callback: (content: WebsiteContentData) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<WebsiteContentData>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      getCachedWebsiteContent(true).then((c) => {
        if (c) callback(c);
      });
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'mv_website_content' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        websiteContentCache = parsed;
        callback(parsed);
      } catch {}
    }
  };

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data?.type === 'CONTENT_UPDATED') {
      if (event.data.payload) {
        websiteContentCache = event.data.payload;
        callback(event.data.payload);
      } else {
        getCachedWebsiteContent(true).then((c) => {
          if (c) callback(c);
        });
      }
    }
  };

  window.addEventListener('atalseva:content-updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('atalseva:content-updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

// ------------------------------------------------------------------------------
// 4. Counter Status Fetching & Reactive Subscriptions
// ------------------------------------------------------------------------------

export async function getCachedCounterStatus(forceRefresh = false): Promise<CounterStatusData> {
  const now = Date.now();

  if (!forceRefresh && counterStatusCache && (now - counterStatusCacheTime < COUNTER_TTL_MS)) {
    return counterStatusCache;
  }

  if (counterStatusInFlight && !forceRefresh) {
    return counterStatusInFlight;
  }

  counterStatusInFlight = (async () => {
    try {
      const res = await fetch('/api/counter-status');
      if (res.ok) {
        const data = await res.json();
        const isOpen = typeof data.isOpen === 'boolean' ? data.isOpen : true;
        const result: CounterStatusData = {
          isOpen,
          reason: data.reason || (data.counterStatus?.statusText) || '',
          statusText: data.statusText || (isOpen ? 'COUNTER OPEN NOW' : 'COUNTER CLOSED'),
          updatedAt: data.updatedAt,
        };
        counterStatusCache = result;
        counterStatusCacheTime = Date.now();
        try {
          localStorage.setItem('mv_counter_open', String(isOpen));
          localStorage.setItem('mv_counter_status_obj', JSON.stringify(result));
        } catch {}
        return result;
      }
    } catch {
      // Fallback
    } finally {
      counterStatusInFlight = null;
    }

    try {
      const savedObj = localStorage.getItem('mv_counter_status_obj');
      if (savedObj) return JSON.parse(savedObj);
    } catch {}

    const saved = localStorage.getItem('mv_counter_open');
    return {
      isOpen: saved !== null ? saved === 'true' : true,
      reason: '',
      statusText: saved === 'false' ? 'COUNTER CLOSED' : 'COUNTER OPEN NOW',
    };
  })();

  return counterStatusInFlight;
}

/**
 * Invalidates and instantly broadcasts counter status changes across all components and open tabs.
 */
export function invalidateCounterStatusCache(freshStatus?: CounterStatusData): void {
  if (freshStatus) {
    counterStatusCache = freshStatus;
    counterStatusCacheTime = Date.now();
    try {
      localStorage.setItem('mv_counter_open', String(freshStatus.isOpen));
      localStorage.setItem('mv_counter_status_obj', JSON.stringify(freshStatus));
      localStorage.setItem('mv_counter_sync_ts', String(Date.now()));
    } catch {}
  } else {
    counterStatusCache = null;
    counterStatusCacheTime = 0;
  }
  counterStatusInFlight = null;

  // Local window event dispatch (0ms)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atalseva:counter-updated', { detail: freshStatus }));
  }

  // Cross-tab broadcast
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'COUNTER_UPDATED', payload: freshStatus });
    } catch {}
  }
}

/**
 * Subscribes a component to instant counter status updates (local, cross-tab, tab focus, and background sync).
 */
export function subscribeToCounterStatus(callback: (status: CounterStatusData) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<CounterStatusData>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      getCachedCounterStatus(true).then(callback);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'mv_counter_status_obj' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        counterStatusCache = parsed;
        callback(parsed);
      } catch {}
    } else if (e.key === 'mv_counter_open') {
      getCachedCounterStatus(true).then(callback);
    }
  };

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data?.type === 'COUNTER_UPDATED') {
      if (event.data.payload) {
        counterStatusCache = event.data.payload;
        callback(event.data.payload);
      } else {
        getCachedCounterStatus(true).then(callback);
      }
    }
  };

  // Immediate check when tab regains focus or visibility
  const handleTabFocus = () => {
    if (document.visibilityState === 'visible') {
      getCachedCounterStatus(true).then(callback);
    }
  };

  window.addEventListener('atalseva:counter-updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('focus', handleTabFocus);
  document.addEventListener('visibilitychange', handleTabFocus);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // Background heart-beat sync every 30 seconds for live counter accuracy
  const intervalId = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      getCachedCounterStatus(true).then(callback);
    }
  }, 30 * 1000);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('atalseva:counter-updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('focus', handleTabFocus);
    document.removeEventListener('visibilitychange', handleTabFocus);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

// ------------------------------------------------------------------------------
// 5. Cross-Tab Authentication Synchronization (Login & Logout)
// ------------------------------------------------------------------------------

export function notifyAuthChanged(loggedIn: boolean, token?: string, user?: any): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atalseva:auth-changed', { detail: { loggedIn, token, user } }));
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'AUTH_CHANGED', payload: { loggedIn, token, user } });
    } catch {}
  }
}

export function subscribeToAuthChanges(callback: (data: { loggedIn: boolean; token?: string; user?: any }) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ loggedIn: boolean; token?: string; user?: any }>;
    if (custom.detail) callback(custom.detail);
  };

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data?.type === 'AUTH_CHANGED') {
      callback(event.data.payload);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'atalseva_admin_token' || e.key === 'atalseva_admin_user') {
      const token = localStorage.getItem('atalseva_admin_token');
      const userStr = localStorage.getItem('atalseva_admin_user');
      const loggedIn = !!(token && userStr && token.length > 10);
      callback({
        loggedIn,
        token: token || undefined,
        user: userStr ? JSON.parse(userStr) : undefined,
      });
    }
  };

  window.addEventListener('atalseva:auth-changed', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('atalseva:auth-changed', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

/**
 * Handles session expiration or invalid session:
 * 1. Clears credentials from localStorage
 * 2. Broadcasts logout to this tab and all open browser tabs
 * 3. Dispatches 'atalseva:session-expired' event
 * 4. Replaces history URL to home ('/') so unauthorized admin paths are immediately cleared
 */
export function handleSessionExpired(redirectToHome: boolean = true): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('atalseva_admin_token');
    localStorage.removeItem('atalseva_admin_user');
    localStorage.removeItem('atalseva_admin_tab');
  } catch {}

  notifyAuthChanged(false);

  window.dispatchEvent(new CustomEvent('atalseva:session-expired'));

  if (redirectToHome) {
    const currentPath = window.location.pathname;
    if (
      currentPath === '/dashboard' ||
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/workspace')
    ) {
      window.history.replaceState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }
}

/**
 * Checks session validity with server using /api/admin/validate-session
 * (Returns HTTP 200 with { valid: boolean } to prevent noisy 401 console logs).
 * If invalid or expired, automatically triggers handleSessionExpired().
 */
export async function validateAdminSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('atalseva_admin_token');
  if (!token || token.length < 10) {
    handleSessionExpired(false);
    return false;
  }

  try {
    const res = await fetch('/api/admin/validate-session', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.valid === true) {
        return true;
      }
    }

    // Session is expired or invalid
    handleSessionExpired(true);
    return false;
  } catch {
    // In case of network interruption, don't immediately clear if offline, but return false
    return false;
  }
}

/**
 * Standard authorized fetch wrapper that automatically passes the Bearer token
 * and intercepts any 401 Unauthorized responses to immediately navigate the user
 * to the home page while clearing invalid credentials.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('atalseva_admin_token') : null;

  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    // Server responded with 401 Unauthorized -> session expired!
    handleSessionExpired(true);
  }

  return response;
}

// ------------------------------------------------------------------------------
// 6. Community Announcements Real-Time Sync
// ------------------------------------------------------------------------------

export function notifyCommunityChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atalseva:community-updated'));
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'COMMUNITY_UPDATED' });
    } catch {}
  }
}

export function subscribeToCommunityUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleEvent = () => callback();

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data?.type === 'COMMUNITY_UPDATED') callback();
  };

  window.addEventListener('atalseva:community-updated', handleEvent);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('atalseva:community-updated', handleEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}
