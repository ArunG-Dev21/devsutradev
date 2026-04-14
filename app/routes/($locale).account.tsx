import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
} from 'react-router';
import type { Route } from './+types/($locale).account';
import { CUSTOMER_DETAILS_QUERY } from '~/graphql/customer-account/CustomerDetailsQuery';

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* Page header */}
        <div className="mb-10 border-b border-border pb-8">
          <p className="text-xs tracking-[0.35em] uppercase text-muted-foreground mb-2 font-medium">
            Sacred Account
          </p>
          <h1 className="text-3xl md:text-4xl font-medium font-heading uppercase tracking-tight">
            My Account
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          {/* Sidebar */}
          <div className="w-full lg:w-72 lg:sticky lg:top-8 shrink-0">
            {/* Avatar card */}
            <div className="rounded-2xl border border-border bg-card p-5 mb-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-semibold shrink-0 select-none">
                {initials}
              </div>
              <div className="min-w-0">
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

  return (
    <nav role="navigation" className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="divide-y divide-border">
        {MENU_ITEMS.map((item) => {
          const isActive =
            location.pathname.includes(item.to) ||
            (location.pathname === '/account' && item.name === 'Orders');
          return (
            <NavLink
              key={item.name}
              to={item.to}
              className={`flex items-center gap-3.5 px-5 py-4 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.name}
              {isActive && (
                <svg className="ml-auto w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              )}
            </NavLink>
          );
        })}

        {/* Sign out — same visual weight but red tint on hover */}
        <Form method="POST" action="/account/logout">
          <button
            type="submit"
            className="w-full flex items-center gap-3.5 px-5 py-4 text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all duration-200 text-left cursor-pointer"
          >
            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </Form>
      </div>
    </nav>
  );
}
