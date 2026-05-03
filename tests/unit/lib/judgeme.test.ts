import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {
  getJudgeMeBatchSummaries,
  getJudgeMeProductReviews,
} from '~/lib/judgeme.server';

const PREVIEW_BADGE = (avg: number, count: number) =>
  `<div data-average-rating='${avg}' data-number-of-reviews='${count}'></div>`;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {'content-type': 'application/json'},
  });
}

function htmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {'content-type': 'text/html'},
  });
}

describe('getJudgeMeBatchSummaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns an empty map when no products are passed', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await getJudgeMeBatchSummaries({
      shopDomain: 'example.myshopify.com',
      apiToken: 'token',
      products: [],
    });
    expect(result.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses preview badge HTML into summaries', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('external_id=111')) return htmlResponse(PREVIEW_BADGE(4.5, 12));
      if (url.includes('external_id=222')) return htmlResponse(PREVIEW_BADGE(5, 3));
      return htmlResponse('');
    });

    const result = await getJudgeMeBatchSummaries({
      shopDomain: 'example.myshopify.com',
      apiToken: 'token',
      products: [
        // Use unique IDs per test to avoid the module-level cache from
        // previous tests in the same suite.
        {id: '111', handle: 'a'},
        {id: '222', handle: 'b'},
      ],
    });

    expect(result.get('111')).toEqual({averageRating: 4.5, reviewCount: 12});
    expect(result.get('222')).toEqual({averageRating: 5, reviewCount: 3});
  });

  it('drops products with zero reviews from the result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      htmlResponse(PREVIEW_BADGE(0, 0)),
    );

    const result = await getJudgeMeBatchSummaries({
      shopDomain: 'example.myshopify.com',
      apiToken: 'token',
      products: [{id: '333', handle: 'c'}],
    });

    expect(result.has('333')).toBe(false);
  });

  it('silently skips products whose fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));

    const result = await getJudgeMeBatchSummaries({
      shopDomain: 'example.myshopify.com',
      apiToken: 'token',
      products: [{id: '444', handle: 'd'}],
    });

    expect(result.size).toBe(0);
  });
});

describe('getJudgeMeProductReviews', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns reviews and summary for a known product', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/widgets/preview_badge')) {
        return htmlResponse(PREVIEW_BADGE(4.7, 9));
      }
      if (url.includes('/products/-1')) {
        return jsonResponse({product: {id: 9001}});
      }
      if (url.includes('/reviews')) {
        return jsonResponse({
          reviews: [
            {
              id: 1,
              rating: 5,
              title: 'Great',
              body: 'Loved it',
              reviewer: {name: 'Asha'},
              created_at: '2026-04-01T00:00:00Z',
              pictures: [],
            },
            {
              id: 2,
              rating: '4',
              body: '  ',
              title: 'Nice mala',
              reviewer_name: 'Kumar',
            },
          ],
        });
      }
      return jsonResponse({});
    });

    const result = await getJudgeMeProductReviews({
      shopDomain: 'example.myshopify.com',
      apiToken: 'token',
      shopifyProductId: '555',
      productHandle: 'mala',
    });

    expect(result.summary).toEqual({averageRating: 4.7, reviewCount: 9});
    expect(result.reviews).toHaveLength(2);
    expect(result.reviews[0]).toMatchObject({
      rating: 5,
      title: 'Great',
      body: 'Loved it',
      reviewerName: 'Asha',
    });
    expect(result.reviews[1].rating).toBe(4);
    expect(result.reviews[1].reviewerName).toBe('Kumar');
  });

  it('returns empty reviews when product lookup fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/widgets/preview_badge')) {
        return htmlResponse(PREVIEW_BADGE(0, 0));
      }
      if (url.includes('/products/-1')) {
        return new Response('not found', {status: 404});
      }
      return jsonResponse({});
    });

    const result = await getJudgeMeProductReviews({
      shopDomain: 'example.myshopify.com',
      apiToken: 'token',
      shopifyProductId: '666',
    });

    expect(result.reviews).toEqual([]);
  });
});
