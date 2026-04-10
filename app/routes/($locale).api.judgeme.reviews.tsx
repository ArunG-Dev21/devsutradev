import {data} from 'react-router';
import type {Route} from './+types/($locale).api.judgeme.reviews';
import {enforceRateLimit} from '~/lib/ratelimit.server';

const JUDGEME_API_ORIGIN = 'https://judge.me';

function asNonEmptyString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function action({request, context}: Route.ActionArgs) {
  if (request.method.toUpperCase() !== 'POST') {
    return data({ok: false, error: 'Method not allowed'}, {status: 405});
  }

  const requireLogin =
    context.env.JUDGEME_REQUIRE_LOGIN_FOR_REVIEW === 'true' ||
    context.env.JUDGEME_REQUIRE_LOGIN_FOR_REVIEW === '1';

  if (requireLogin) {
    const loggedIn = await context.customerAccount.isLoggedIn();
    if (!loggedIn) {
      return data({ok: false, error: 'Please log in to write a review.'}, {status: 401});
    }
  }

  const rl = await enforceRateLimit({
    request,
    session: context.session,
    namespace: 'judgeme_review_submit',
    windowMs: 60 * 60 * 1000,
    limit: 3,
    burstWindowMs: 60 * 1000,
    burstLimit: 1,
    ipWindowMs: 60 * 60 * 1000,
    ipLimit: 10,
  });
  if (!rl.ok) {
    if (rl.status === 403) {
      return data({ok: false, error: 'Forbidden'}, {status: 403});
    }
    return data(
      {ok: false, error: 'Too many review attempts. Try again shortly.'},
      {status: 429, headers: {'Retry-After': String(rl.retryAfterSeconds)}},
    );
  }

  const token = context.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;

  if (!token || !shopDomain) {
    return data({ok: false, error: 'Reviews are not configured'}, {status: 500});
  }

  const formData = await request.formData();

  // Honeypot (basic bot protection)
  if (asNonEmptyString(formData.get('website'))) {
    return data({ok: true}, {status: 200});
  }

  const productId = asNonEmptyString(formData.get('productId'));
  const name = asNonEmptyString(formData.get('name'));
  const email = asNonEmptyString(formData.get('email'));
  const ratingRaw = asNonEmptyString(formData.get('rating'));
  const title = asNonEmptyString(formData.get('title'));
  const body = asNonEmptyString(formData.get('body'));

  if (!productId) return data({ok: false, error: 'Missing productId'}, {status: 400});
  if (!name) return data({ok: false, error: 'Name is required'}, {status: 400});
  if (!email) return data({ok: false, error: 'Email is required'}, {status: 400});
  if (!body || body.length < 10) {
    return data(
      {ok: false, error: 'Review must be at least 10 characters'},
      {status: 400},
    );
  }

  const ratingNum = Number(ratingRaw ?? '');
  const rating = Number.isFinite(ratingNum)
    ? Math.max(1, Math.min(5, Math.round(ratingNum)))
    : null;
  if (!rating) return data({ok: false, error: 'Rating is required'}, {status: 400});

  const payload = {
    shop_domain: shopDomain,
    api_token: token,
    platform: 'shopify',
    name,
    email,
    rating,
    body,
    id: productId,
    url: shopDomain,
    ...(title ? {title} : null),
    reviewer_name_format: 'anonymous',
  };

  try {
    const res = await fetch(`${JUDGEME_API_ORIGIN}/api/v1/reviews`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return data(
        {ok: false, error: `Judge.me error: ${res.status}`},
        {status: 502},
      );
    }

    return data({ok: true}, {status: 200, headers: {'Cache-Control': 'no-store'}});
  } catch {
    return data({ok: false, error: 'Failed to submit review'}, {status: 502});
  }
}
