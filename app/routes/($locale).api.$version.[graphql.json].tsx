import type {Route} from './+types/($locale).api.$version.[graphql.json]';

export async function action({params, context, request}: Route.ActionArgs) {
  const checkoutDomain =
    context.env.PUBLIC_CHECKOUT_DOMAIN || context.env.PUBLIC_STORE_DOMAIN;

  if (!checkoutDomain) {
    return new Response('Missing checkout domain configuration', {status: 500});
  }

  const response = await fetch(
    `https://${checkoutDomain}/api/${params.version}/graphql.json`,
    {
      method: 'POST',
      body: request.body,
      headers: request.headers,
    },
  );

  return new Response(response.body, {headers: new Headers(response.headers)});
}
