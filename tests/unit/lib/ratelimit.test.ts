import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';

function makeSession() {
  const store = new Map<string, unknown>();
  return {
    get: (k: string) => store.get(k),
    set: (k: string, v: unknown) => store.set(k, v),
    _store: store,
  };
}

function makeRequest(opts?: {origin?: string; ip?: string}): Request {
  // The native Request constructor treats `Origin` as a forbidden header and
  // silently drops it, so we duck-type the minimal surface enforceRateLimit uses.
  const headers = new Headers();
  if (opts?.origin !== undefined) headers.set('x-test-origin', opts.origin);
  if (opts?.ip) headers.set('cf-connecting-ip', opts.ip);
  return {
    url: 'https://example.com/api',
    headers: {
      get(name: string) {
        if (name.toLowerCase() === 'origin') return opts?.origin ?? null;
        return headers.get(name);
      },
    },
  } as unknown as Request;
}

function installCachesShim() {
  const store = new Map<string, Response>();
  (globalThis as any).caches = {
    open: async () => ({
      match: async (key: string) => store.get(key)?.clone(),
      put: async (key: string, res: Response) => {
        store.set(key, res.clone());
      },
    }),
  };
  return store;
}

describe('enforceRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as any).caches;
  });

  it('blocks cross-origin requests with 403', async () => {
    installCachesShim();
    const {enforceRateLimit} = await import('~/lib/ratelimit.server');
    const result = await enforceRateLimit({
      request: makeRequest({origin: 'https://attacker.com'}),
      session: makeSession(),
      namespace: 'x',
      windowMs: 60_000,
      limit: 5,
      burstWindowMs: 10_000,
      burstLimit: 3,
      ipWindowMs: 60_000,
      ipLimit: 10,
    });
    expect(result).toEqual({ok: false, status: 403});
  });

  it('allows requests within the limit', async () => {
    installCachesShim();
    const {enforceRateLimit} = await import('~/lib/ratelimit.server');
    const session = makeSession();

    const result = await enforceRateLimit({
      request: makeRequest({origin: 'https://example.com', ip: '1.1.1.1'}),
      session,
      namespace: 'submit-a',
      windowMs: 60_000,
      limit: 5,
      burstWindowMs: 10_000,
      burstLimit: 3,
      ipWindowMs: 60_000,
      ipLimit: 10,
    });

    expect(result).toEqual({ok: true});
  });

  it('returns 429 once the burst limit is exceeded', async () => {
    installCachesShim();
    const {enforceRateLimit} = await import('~/lib/ratelimit.server');
    const session = makeSession();
    const args = {
      session,
      namespace: 'submit-b',
      windowMs: 60_000,
      limit: 5,
      burstWindowMs: 10_000,
      burstLimit: 2,
      ipWindowMs: 60_000,
      ipLimit: 10,
    };

    const r1 = await enforceRateLimit({
      request: makeRequest({origin: 'https://example.com', ip: '2.2.2.2'}),
      ...args,
    });
    const r2 = await enforceRateLimit({
      request: makeRequest({origin: 'https://example.com', ip: '2.2.2.2'}),
      ...args,
    });
    const r3 = await enforceRateLimit({
      request: makeRequest({origin: 'https://example.com', ip: '2.2.2.2'}),
      ...args,
    });

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(false);
    if (!r3.ok && r3.status === 429) {
      expect(r3.retryAfterSeconds).toBeGreaterThan(0);
    } else {
      throw new Error('expected r3 to be a 429');
    }
  });

  it('treats requests with no Origin header as same-origin', async () => {
    installCachesShim();
    const {enforceRateLimit} = await import('~/lib/ratelimit.server');
    const result = await enforceRateLimit({
      request: makeRequest({ip: '3.3.3.3'}),
      session: makeSession(),
      namespace: 'submit-c',
      windowMs: 60_000,
      limit: 5,
      burstWindowMs: 10_000,
      burstLimit: 3,
      ipWindowMs: 60_000,
      ipLimit: 10,
    });
    expect(result).toEqual({ok: true});
  });
});
