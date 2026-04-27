import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigation,
} from 'react-router';
import { useEffect, useRef, useState } from 'react';
import type { Route } from './+types/($locale).account';
import { CUSTOMER_DETAILS_QUERY } from '~/graphql/customer-account/CustomerDetailsQuery';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'My Account | Devasutra' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
};

export function shouldRevalidate() {
  return true;
}

export async function loader({ context }: Route.LoaderArgs) {
  const { customerAccount } = context;
  customerAccount.handleAuthStatus();

  const { data, errors } = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    { customer: data.customer },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const { customer } = useLoaderData<typeof loader>();

  const displayName =
    customer?.firstName
      ? `${customer.firstName}${customer.lastName ? ' ' + customer.lastName : ''}`
      : customer?.displayName || customer?.emailAddress?.emailAddress || 'Devotee';

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Banner */}
      <section className="border-b border-border bg-muted/20">
        <RouteBreadcrumbBanner variant="light" />
        <div className="container mx-auto px-4 py-10 sm:py-14 sm:px-6 lg:px-8 text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-muted-foreground mb-3 font-medium">
            Sacred Account
          </p>
          <h1 className="text-3xl md:text-4xl font-medium font-heading uppercase tracking-tight">
            My Account
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

          {/* Sidebar */}
          <div className="w-full lg:w-60 xl:w-64 lg:sticky lg:top-8 shrink-0">
            {/* Avatar card */}
            <div className="rounded-2xl border border-border bg-card px-5 py-6 mb-3 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-semibold select-none shrink-0">
                {initials}
              </div>
              <div className="min-w-0 w-full">
                <p className="font-semibold text-foreground text-sm leading-snug truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {customer?.emailAddress?.emailAddress || ''}
                </p>
              </div>
            </div>

            <AccountMenu />
          </div>

          {/* Main content */}
          <div className="w-full min-w-0 flex-1">
            <Outlet context={{ customer }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const MENU_ITEMS = [
  {
    name: 'Orders',
    to: '/account/orders',
    icon: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z',
  },
  {
    name: 'Wishlist',
    to: '/account/wishlist',
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z',
  },
  {
    name: 'Profile',
    to: '/account/profile',
    icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
  },
  {
    name: 'Addresses',
    to: '/account/addresses',
    icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
  },
];

function AccountMenu() {
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <nav role="navigation" className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-muted-foreground/70 px-1">
            Navigation
          </p>
        </div>
        <div className="p-2 space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const isActive =
              location.pathname.includes(item.to) ||
              (location.pathname === '/account' && item.name === 'Orders');
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.name}
                {isActive && (
                  <svg className="ml-auto w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </NavLink>
            );
          })}

          <div className="pt-1 border-t border-border/60 mt-1">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50/60 dark:hover:bg-red-950/20 transition-all duration-200 text-left cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <LogoutConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </>
  );
}

function LogoutConfirmModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigation = useNavigation();
  const isLoggingOut =
    navigation.state !== 'idle' &&
    navigation.formAction === '/account/logout';
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Esc to close + lock scroll + autofocus the confirm button
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoggingOut) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, isLoggingOut]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      aria-describedby="logout-confirm-desc"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={() => !isLoggingOut && onClose()}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm border-0 p-0 cursor-default"
      />

      {/* Card */}
      <div className="relative z-10 w-full sm:w-[440px] sm:max-w-[92vw] bg-card text-card-foreground border border-border shadow-2xl rounded-t-2xl sm:rounded-2xl p-6 sm:p-7 m-0 sm:m-4 transform transition-all">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 mx-auto sm:mx-0 mb-4">
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
        </div>

        <h2
          id="logout-confirm-title"
          className="text-lg sm:text-xl font-semibold text-foreground text-center sm:text-left"
        >
          Sign out of your account?
        </h2>
        <p
          id="logout-confirm-desc"
          className="mt-2 text-sm text-muted-foreground text-center sm:text-left leading-relaxed"
        >
          You will need to sign in again to view your orders, wishlist, and saved addresses.
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="inline-flex justify-center items-center px-5 py-2.5 rounded-full text-sm font-medium border border-border bg-background text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <Form method="POST" action="/account/logout" className="contents">
            <button
              ref={confirmRef}
              type="submit"
              disabled={isLoggingOut}
              className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing out…
                </>
              ) : (
                'Sign Out'
              )}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
