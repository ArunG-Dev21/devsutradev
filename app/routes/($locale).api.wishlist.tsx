import { data } from 'react-router';
import type { Route } from './+types/($locale).api.wishlist';
import {
  CUSTOMER_WISHLIST_QUERY,
  CUSTOMER_WISHLIST_SET_MUTATION,
} from '~/graphql/customer-account/CustomerWishlistQueries';

const NAMESPACE = 'custom';
const KEY = 'wishlist';
const TYPE = 'list.product_reference';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

type WishlistQueryResult = {
  customer: {
    id: string;
    metafield: { value: string; type: string } | null;
  } | null;
};

type WishlistSetResult = {
  metafieldsSet: {
    metafields: Array<{ key: string; namespace: string; value: string }> | null;
    userErrors: Array<{
      code: string | null;
      field: string[] | null;
      message: string;
    }>;
  } | null;
};

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  const { customerAccount } = context;
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return data(
      { wishlist: [] as string[], isLoggedIn: false },
      { headers: NO_STORE },
    );
  }

  try {
    const { data: response } = await customerAccount.query<WishlistQueryResult>(
      CUSTOMER_WISHLIST_QUERY,
    );
    const value = response?.customer?.metafield?.value;
    return data(
      { wishlist: parseList(value), isLoggedIn: true },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error('[Wishlist Loader]', err);
    return data(
      { wishlist: [] as string[], isLoggedIn: true },
      { headers: NO_STORE },
    );
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  const { customerAccount } = context;
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return data(
      { ok: false, error: 'Not logged in', wishlist: [] as string[] },
      { status: 401, headers: NO_STORE },
    );
  }

  const formData = await request.formData();
  const productId = String(formData.get('productId') || '').trim();
  const op = String(formData.get('op') || 'toggle');

  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(productId)) {
    return data(
      { ok: false, error: 'Invalid productId', wishlist: [] as string[] },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const { data: readResp } = await customerAccount.query<WishlistQueryResult>(
      CUSTOMER_WISHLIST_QUERY,
    );
    const customerId = readResp?.customer?.id;
    if (!customerId) {
      return data(
        { ok: false, error: 'Customer not found', wishlist: [] as string[] },
        { status: 404, headers: NO_STORE },
      );
    }

    const current = parseList(readResp?.customer?.metafield?.value);
    let next: string[];
    if (op === 'remove') {
      next = current.filter((id) => id !== productId);
    } else if (op === 'add') {
      next = current.includes(productId) ? current : [...current, productId];
    } else {
      next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
    }

    const { data: setResp, errors } =
      await customerAccount.mutate<WishlistSetResult>(
        CUSTOMER_WISHLIST_SET_MUTATION,
        {
          variables: {
            metafields: [
              {
                ownerId: customerId,
                namespace: NAMESPACE,
                key: KEY,
                type: TYPE,
                value: JSON.stringify(next),
              },
            ],
          },
        },
      );

    const userErrors = setResp?.metafieldsSet?.userErrors;
    if (errors?.length || (userErrors && userErrors.length > 0)) {
      const message =
        userErrors?.[0]?.message ||
        errors?.[0]?.message ||
        'Failed to update wishlist';
      return data(
        { ok: false, error: message, wishlist: current },
        { status: 500, headers: NO_STORE },
      );
    }

    return data({ ok: true, wishlist: next }, { headers: NO_STORE });
  } catch (err) {
    console.error('[Wishlist Action]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return data(
      { ok: false, error: message, wishlist: [] as string[] },
      { status: 500, headers: NO_STORE },
    );
  }
}
