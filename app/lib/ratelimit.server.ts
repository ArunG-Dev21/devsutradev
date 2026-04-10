type RateLimitState = {
  timestamps: number[];
};

function nowMs() {
  return Date.now();
}

function prune(timestamps: number[], windowMs: number, now: number) {
  const cutoff = now - windowMs;
  return timestamps.filter((t) => typeof t === 'number' && t >= cutoff);
}

function getClientIp(request: Request) {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  const xff = request.headers.get('x-forwarded-for');
  if (xff && xff.trim()) return xff.split(',')[0]?.trim() || null;

  return null;
}

async function readCacheJson(cache: Cache, key: string): Promise<RateLimitState | null> {
  const res = await cache.match(key);
  if (!res) return null;
  try {
    const json = (await res.json()) as any;
    if (json && Array.isArray(json.timestamps)) {
      return {timestamps: json.timestamps};
    }
  } catch {
    // ignore
  }
  return null;
}

async function writeCacheJson(cache: Cache, key: string, state: RateLimitState, ttlSeconds: number) {
  const res = new Response(JSON.stringify(state), {
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${Math.max(1, Math.min(ttlSeconds, 60 * 60))}`,
    },
  });
  await cache.put(key, res);
}

function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // some clients omit Origin
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export type RateLimitResult =
  | {ok: true}
  | {ok: false; status: 429; retryAfterSeconds: number};

export async function enforceRateLimit(options: {
  request: Request;
  session: {get: (k: string) => unknown; set: (k: string, v: unknown) => void};
  namespace: string;
  windowMs: number;
  limit: number;
  burstWindowMs: number;
  burstLimit: number;
  ipWindowMs: number;
  ipLimit: number;
}): Promise<RateLimitResult | {ok: false; status: 403}> {
  const {
    request,
    session,
    namespace,
    windowMs,
    limit,
    burstWindowMs,
    burstLimit,
    ipWindowMs,
    ipLimit,
  } = options;

  if (!isSameOriginRequest(request)) return {ok: false, status: 403};

  const now = nowMs();

  // Session-based limit
  const sessionKey = `rl:${namespace}`;
  const existing = session.get(sessionKey) as any;
  const sessionState: RateLimitState = {
    timestamps: Array.isArray(existing?.timestamps) ? existing.timestamps : [],
  };
  const sessionTimestamps = prune(sessionState.timestamps, windowMs, now);
  const sessionBurstTimestamps = prune(sessionTimestamps, burstWindowMs, now);

  if (sessionTimestamps.length >= limit || sessionBurstTimestamps.length >= burstLimit) {
    const oldest = sessionBurstTimestamps[0] ?? sessionTimestamps[0] ?? now;
    const retryAfterMs = Math.max(1000, (burstWindowMs - (now - oldest)));
    return {ok: false, status: 429, retryAfterSeconds: Math.ceil(retryAfterMs / 1000)};
  }

  sessionTimestamps.push(now);
  session.set(sessionKey, {timestamps: sessionTimestamps});

  // IP-based limit (best-effort via Cache API)
  const ip = getClientIp(request);
  if (ip) {
    const cache = await caches.open('ratelimit');
    const cacheKey = `https://ratelimit.local/${encodeURIComponent(namespace)}/${encodeURIComponent(ip)}`;
    const cached = await readCacheJson(cache, cacheKey);
    const ipState: RateLimitState = {
      timestamps: Array.isArray(cached?.timestamps) ? cached!.timestamps : [],
    };
    const ipTimestamps = prune(ipState.timestamps, ipWindowMs, now);
    if (ipTimestamps.length >= ipLimit) {
      const oldest = ipTimestamps[0] ?? now;
      const retryAfterMs = Math.max(1000, ipWindowMs - (now - oldest));
      return {ok: false, status: 429, retryAfterSeconds: Math.ceil(retryAfterMs / 1000)};
    }
    ipTimestamps.push(now);
    await writeCacheJson(cache, cacheKey, {timestamps: ipTimestamps}, Math.ceil(ipWindowMs / 1000));
  }

  return {ok: true};
}

