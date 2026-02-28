import type { Route } from './+types/($locale).account_.authorize';

export async function loader({ context }: Route.LoaderArgs) {
  try {
    return context.customerAccount.authorize();
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
