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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
            My Account
          </h1>
          <p className="text-base text-muted-foreground">
            Welcome back, {customer?.firstName || 'Valued Customer'}. Manage your sacred journey here.
          </p>
        </div>

        {/* Two-Column Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Sidebar Menu */}
          <div className="w-full lg:w-1/4 lg:sticky lg:top-8">
            <AccountMenu />
          </div>

          {/* Main Content Hub */}
          <div className="w-full lg:w-3/4">
            <Outlet context={{ customer }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  const location = useLocation();

  const menuItems = [
    { name: 'Orders', to: '/account/orders', icon: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z' },
    { name: 'Profile', to: '/account/profile', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' },
    { name: 'Addresses', to: '/account/addresses', icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z' },
  ];

  return (
    <div className="bg-card text-card-foreground rounded-3xl border border-border overflow-hidden shadow-sm">
      <nav role="navigation" className="flex flex-col">
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.to);
          return (
            <NavLink
              key={item.name}
              to={item.to}
              className={`flex items-center gap-4 px-6 py-4 text-sm font-semibold transition-all duration-300 border-l-4 ${isActive
                  ? 'border-foreground text-foreground bg-muted'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.name}
            </NavLink>
          );
        })}

        <div className="border-t border-border">
          <Logout />
        </div>
      </nav>
    </div>
  );
}

function Logout() {
  return (
    <Form className="w-full" method="POST" action="/account/logout">
      <button
        type="submit"
        className="w-full flex items-center gap-4 px-6 py-4 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors border-l-4 border-transparent text-left cursor-pointer"
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
        </svg>
        Sign Out
      </button>
    </Form>
  );
}
