import { redirect } from 'react-router';
import type { Route } from './+types/($locale).account.$';

// Fallback wild card for all unauthenticated routes in account section.
// If the user is not logged in, handleAuthStatus() redirects to login.
export async function loader({ context }: Route.LoaderArgs) {
  try {
    context.customerAccount.handleAuthStatus();
  } catch (error) {
    console.error('[Account Auth Status Error]', error);
    // If auth check fails, send user to login explicitly
    return redirect('/account/login');
  }

  return redirect('/account');
}
