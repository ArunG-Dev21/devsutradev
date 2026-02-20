import type { Route } from './+types/account_.login';

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const acrValues = url.searchParams.get('acr_values') || undefined;
  const loginHint = url.searchParams.get('login_hint') || undefined;
  const loginHintMode = url.searchParams.get('login_hint_mode') || undefined;
  const locale = url.searchParams.get('locale') || undefined;

  try {
    return context.customerAccount.login({
      countryCode: context.storefront.i18n.country,
      acrValues,
      loginHint,
      loginHintMode,
      locale,
    });
  } catch (error) {
    // Log full error for debugging
    console.error('[Login Error]', error);

    // Surface a helpful message for redirect_uri_mismatch or config issues
    const message =
      error instanceof Error ? error.message : 'Login failed unexpectedly.';

    throw new Response(
      JSON.stringify({
        error: 'Login Error',
        message,
        hint: 'Ensure your domain is registered as a Callback URI in Shopify Admin → Customer Account API settings. Localhost is not supported — use a tunnel (e.g. shopify hydrogen dev) or Oxygen deployment.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
