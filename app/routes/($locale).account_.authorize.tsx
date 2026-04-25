import type { Route } from './+types/($locale).account_.authorize';

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const { customerAccount, cart } = context;
    const response = await customerAccount.authorize();

    // Bind the active cart to the now-logged-in customer so the cart follows
    // them across devices. Best-effort — auth has already succeeded and that
    // is the priority; we never want to fail login because of cart sync.
    let cartHeaders: Headers | undefined;
    try {
      const accessToken = await customerAccount.getAccessToken();
      if (accessToken) {
        const result = await cart.updateBuyerIdentity({
          customerAccessToken: accessToken,
        });
        if (result?.cart?.id) {
          // Shopify may return a different cart id (e.g. when resolving the
          // customer's prior cart). Persist it so the cart cookie matches.
          cartHeaders = cart.setCartId(result.cart.id);
        }
      }
    } catch (cartErr) {
      console.error('[Cart Buyer Identity Update]', cartErr);
    }

    if (cartHeaders) {
      const merged = new Headers(response.headers);
      cartHeaders.forEach((value, key) => merged.append(key, value));
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: merged,
      });
    }
    return response;
  } catch (error) {
    console.error('[Authorize Error]', error);

    const message =
      error instanceof Error ? error.message : 'Authorization failed.';

    throw new Response(
      JSON.stringify({
        error: 'Authorization Error',
        message,
        hint: 'The OAuth callback failed. Verify that your Callback URI in Shopify Admin matches your current domain exactly (e.g. https://your-domain.tryhydrogen.dev/account/authorize).',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
