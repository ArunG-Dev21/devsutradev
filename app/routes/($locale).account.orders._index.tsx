import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import type { Route } from './+types/($locale).account.orders._index';
import { useRef } from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import { CUSTOMER_ORDERS_QUERY } from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import { PaginatedResourceSection } from '~/features/collection/components/PaginatedResourceSection';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Orders' }];
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const { customerAccount } = context;
  const paginationVariables = getPaginationVariables(request, { pageBy: 20 });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const { data, errors } = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return { customer: data.customer, filters };
}

export default function Orders() {
  const { customer, filters } = useLoaderData<OrdersLoaderData>();
  const { orders } = customer;

  return (
    <div>
      <div className="mb-8 pb-6 border-b border-border">
        <h2 className="text-2xl font-heading font-medium text-foreground tracking-tight text-center">Order History</h2>
        <p className="text-sm text-muted-foreground mt-1.5 text-center">
          Review your past purchases and track current shipments.
        </p>
        <div className="mt-5 flex justify-center">
          <OrderSearchForm currentFilters={filters} />
        </div>
      </div>

      <div aria-live="polite">
        {orders?.nodes.length ? (
          <PaginatedResourceSection connection={orders}>
            {({ node: order }) => <OrderItem key={order.id} order={order} />}
          </PaginatedResourceSection>
        ) : (
          <EmptyOrders hasFilters={!!(filters.name || filters.confirmationNumber)} />
        )}
      </div>
    </div>
  );
}

function EmptyOrders({ hasFilters = false }: { hasFilters?: boolean }) {
  return (
    <div className="py-20 text-center border border-dashed border-border rounded-2xl flex flex-col items-center">
      <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm font-semibold text-foreground mb-1.5">No orders found</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">No orders match your search criteria.</p>
          <Link
            to="/account/orders"
            className="px-5 py-2.5 bg-muted text-foreground text-[11px] font-semibold tracking-widest uppercase rounded-full hover:bg-muted/80 transition-colors"
          >
            Clear Filters
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-foreground mb-1.5">No orders yet</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">When you make a purchase, your order history will appear here.</p>
          <Link
            to="/collections"
            className="px-6 py-3 bg-foreground text-background text-[11px] font-semibold tracking-widest uppercase rounded-full hover:opacity-85 transition-opacity"
          >
            Start Shopping
          </Link>
        </>
      )}
    </div>
  );
}

function OrderSearchForm({ currentFilters }: { currentFilters: OrderFilterParams }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching = navigation.state !== 'idle' && navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);
  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData.get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)?.toString().trim();
    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber) params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);
    setSearchParams(params);
  };

  const inputClass = "w-full sm:w-36 px-0 py-2 border-b border-border bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors rounded-none text-sm";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
        <input
          type="search"
          name={ORDER_FILTER_FIELDS.NAME}
          placeholder="Order #"
          defaultValue={currentFilters.name || ''}
          className={inputClass}
        />
        <input
          type="search"
          name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
          placeholder="Confirmation #"
          defaultValue={currentFilters.confirmationNumber || ''}
          className={inputClass}
        />
        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest bg-foreground text-background rounded-full hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {isSearching ? '...' : 'Search'}
          </button>
          {hasFilters && (
            <button
              type="button"
              disabled={isSearching}
              onClick={() => { setSearchParams(new URLSearchParams()); formRef.current?.reset(); }}
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest bg-muted text-foreground rounded-full hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function OrderItem({ order }: { order: OrderItemFragment }) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;

  const statusStyles =
    order.financialStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    order.financialStatus === 'REFUNDED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-muted text-muted-foreground border-border';

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-3">
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/account/orders/${btoa(order.id)}`}
            className="text-base font-semibold text-foreground hover:underline underline-offset-2 transition-colors"
          >
            Order #{order.number}
          </Link>
          <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full border ${statusStyles}`}>
            {order.financialStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <span>
            {new Intl.DateTimeFormat('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
            }).format(new Date(order.processedAt))}
          </span>
          <span className="font-semibold text-foreground">
            <Money withoutTrailingZeros data={order.totalPrice} />
          </span>
          {fulfillmentStatus && (
            <span className="text-xs uppercase tracking-wider font-medium">
              {fulfillmentStatus}
            </span>
          )}
        </div>

        {order.confirmationNumber && (
          <p className="text-xs text-muted-foreground font-mono">
            Confirmation: {order.confirmationNumber}
          </p>
        )}
      </div>

      <Link
        to={`/account/orders/${btoa(order.id)}`}
        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 border border-border text-foreground text-[11px] font-semibold tracking-widest uppercase rounded-full hover:bg-muted transition-colors"
      >
        View Details
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}
