const JUDGEME_API_ORIGIN = 'https://judge.me';
const SUMMARY_CACHE_TTL_MS = 1000 * 60 * 15;
const summaryCache = new Map<string, { expiresAt: number; summary: JudgeMeSummary | null }>();
const summaryInflight = new Map<string, Promise<JudgeMeSummary | null>>();

export type JudgeMeSummary = {
  averageRating: number;
  reviewCount: number;
};

export type JudgeMeReview = {
  id: number | string;
  rating: number;
  title?: string;
  body: string;
  reviewerName: string;
  createdAt?: string;
  pictureUrls: string[];
};

export type JudgeMeProductReviews = {
  summary: JudgeMeSummary | null;
  reviews: JudgeMeReview[];
};

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function extractFirstStringField(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string | URL, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url.toString(), { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchJson(url: URL): Promise<unknown> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`Judge.me API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchTextOrJson(url: URL): Promise<string | unknown> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`Judge.me API request failed: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();

  const text = await res.text();
  // Some endpoints return JSON without a JSON content-type.
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      return JSON.parse(text);
    } catch {
      // fall through
    }
  }
  return text;
}

function parsePreviewBadgeSummary(widgetHtml: string): JudgeMeSummary | null {
  const avgMatch = widgetHtml.match(/data-average-rating=(['"])(.*?)\1/i);
  const countMatch = widgetHtml.match(/data-number-of-reviews=(['"])(.*?)\1/i);

  const averageRating = asNumber(avgMatch?.[2]);
  const reviewCount = asNumber(countMatch?.[2]);

  if (averageRating == null || reviewCount == null) return null;
  return { averageRating, reviewCount };
}

function normalizeReview(input: any): JudgeMeReview | null {
  const rating =
    asNumber(input?.rating) ??
    asNumber(input?.rating_score) ??
    asNumber(input?.score) ??
    0;

  const id = input?.id ?? input?.review_id ?? input?.uuid ?? `${input?.created_at ?? ''}-${Math.random()}`;

  const body =
    String(input?.body ?? input?.review ?? input?.content ?? input?.message ?? '')
      .trim();

  if (!body) return null;

  const title = typeof input?.title === 'string' ? input.title.trim() : undefined;

  const reviewerName =
    String(
      input?.reviewer?.name ??
        input?.reviewer_name ??
        input?.name ??
        input?.reviewer ??
        'Anonymous',
    ).trim() || 'Anonymous';

  const createdAt =
    typeof input?.created_at === 'string'
      ? input.created_at
      : typeof input?.createdAt === 'string'
        ? input.createdAt
        : undefined;

  const pictureUrlsRaw =
    input?.picture_urls ??
    input?.pictures ??
    input?.images ??
    input?.media ??
    [];

  const pictureUrls =
    Array.isArray(pictureUrlsRaw)
      ? pictureUrlsRaw
          .map((u: unknown) => {
            if (typeof u === 'string') return u;
            if (u && typeof u === 'object' && 'url' in u) {
              const url = (u as {url?: unknown}).url;
              if (typeof url === 'string') return url;
            }
            return null;
          })
          .filter((u): u is string => typeof u === 'string' && u.length > 0)
      : [];

  return {
    id,
    rating: Math.max(0, Math.min(5, Math.round(Number(rating)))),
    title,
    body,
    reviewerName,
    createdAt,
    pictureUrls,
  };
}

export async function getJudgeMeProductReviews(options: {
  shopDomain: string;
  apiToken: string;
  shopifyProductId: string;
  productHandle?: string;
  perPage?: number;
}): Promise<JudgeMeProductReviews> {
  const { shopDomain, apiToken, shopifyProductId, productHandle, perPage = 10 } = options;

  const baseParams = new URLSearchParams({
    shop_domain: shopDomain,
    api_token: apiToken,
  });

  // 1) Summary (average + count) — best effort.
  let summary: JudgeMeSummary | null = null;
  try {
    const badgeUrl = new URL('/api/v1/widgets/preview_badge', JUDGEME_API_ORIGIN);
    const params = new URLSearchParams(baseParams);
    // Prefer external_id (Shopify numeric product ID) when available; fallback to handle.
    params.set('external_id', shopifyProductId);
    if (productHandle) params.set('handle', productHandle);
    badgeUrl.search = params.toString();

    const badgeResponse = await fetchTextOrJson(badgeUrl);
    const badgeHtml =
      typeof badgeResponse === 'string'
        ? badgeResponse
        : extractFirstStringField(badgeResponse, ['badge', 'html', 'widget', 'preview_badge']) ??
          '';
    summary = badgeHtml ? parsePreviewBadgeSummary(badgeHtml) : null;
  } catch {
    // ignore
  }

  // 2) Resolve Judge.me product ID from Shopify product ID.
  let judgeMeProductId: number | null = null;
  try {
    const productUrl = new URL('/api/v1/products/-1', JUDGEME_API_ORIGIN);
    const params = new URLSearchParams(baseParams);
    params.set('external_id', shopifyProductId);
    productUrl.search = params.toString();

    const productJson: any = await fetchJson(productUrl);
    const productObj = productJson?.product ?? productJson;
    judgeMeProductId = asNumber(productObj?.id);
  } catch {
    // ignore
  }

  if (!judgeMeProductId) return { summary, reviews: [] };

  // 3) Fetch reviews (first page only).
  try {
    const reviewsUrl = new URL('/api/v1/reviews', JUDGEME_API_ORIGIN);
    const params = new URLSearchParams(baseParams);
    params.set('product_id', String(judgeMeProductId));
    params.set('per_page', String(perPage));
    params.set('page', '1');
    reviewsUrl.search = params.toString();

    const reviewsJson: any = await fetchJson(reviewsUrl);
    const rawReviews = reviewsJson?.reviews ?? reviewsJson?.data?.reviews ?? [];

    const reviews: JudgeMeReview[] = Array.isArray(rawReviews)
      ? rawReviews.map(normalizeReview).filter(Boolean)
      : [];

    return { summary, reviews };
  } catch {
    return { summary, reviews: [] };
  }
}

/**
 * Fetch Judge.me review summaries for multiple products in parallel.
 * Returns a Map<shopifyProductId, JudgeMeSummary>.
 * Missing / errored products are silently skipped.
 */
export async function getJudgeMeBatchSummaries(options: {
  shopDomain: string;
  apiToken: string;
  products: Array<{ id: string; handle: string }>;
}): Promise<Map<string, JudgeMeSummary>> {
  const { shopDomain, apiToken, products } = options;
  const result = new Map<string, JudgeMeSummary>();

  if (!products.length) return result;

  const baseParams = new URLSearchParams({
    shop_domain: shopDomain,
    api_token: apiToken,
  });

  const uniqueProducts = Array.from(
    new Map(products.map((product) => [product.id, product])).values(),
  );

  const fetches = uniqueProducts.map(async ({ id, handle }) => {
    const cacheKey = `${shopDomain}:${id}`;
    const now = Date.now();
    const cached = summaryCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      if (cached.summary && cached.summary.reviewCount > 0) result.set(id, cached.summary);
      return;
    }

    let inflight = summaryInflight.get(cacheKey);
    if (!inflight) {
      inflight = (async () => {
        try {
          const badgeUrl = new URL('/api/v1/widgets/preview_badge', JUDGEME_API_ORIGIN);
          const params = new URLSearchParams(baseParams);
          params.set('external_id', id);
          params.set('handle', handle);
          badgeUrl.search = params.toString();

          const response = await fetchTextOrJson(badgeUrl);
          const html =
            typeof response === 'string'
              ? response
              : extractFirstStringField(response, ['badge', 'html', 'widget', 'preview_badge']) ?? '';
          return html ? parsePreviewBadgeSummary(html) : null;
        } catch {
          return null;
        }
      })();
      summaryInflight.set(cacheKey, inflight);
    }

    const summary = await inflight.finally(() => summaryInflight.delete(cacheKey));
    summaryCache.set(cacheKey, {
      expiresAt: now + SUMMARY_CACHE_TTL_MS,
      summary,
    });
    if (summary && summary.reviewCount > 0) result.set(id, summary);
  });

  await Promise.allSettled(fetches);
  return result;
}
