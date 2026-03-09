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
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Orders' }];
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const { customerAccount } = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

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
    <div className="account-orders">
      <div className="mb-8 border-b border-border pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Order History</h2>
          <p className="text-sm text-neutral-500 mt-2">
            Review your past purchases and track current shipments.
          </p>
        </div>
        <OrderSearchForm currentFilters={filters} />
      </div>

      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders}>
          {({ node: order }) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({ hasFilters = false }: { hasFilters?: boolean }) {
  return (
    <div className="p-8 md:p-12 text-center bg-card text-card-foreground rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      </div>

      {hasFilters ? (
        <>
          <p className="text-base font-semibold text-stone-900 mb-2">No orders found.</p>
          <p className="text-sm text-stone-500 mb-6 max-w-sm">We couldn&apos;t find any orders matching your search criteria.</p>
          <Link
            to="/account/orders"
            className="px-6 py-2.5 bg-stone-100 text-stone-900 text-xs font-semibold tracking-widest uppercase rounded-xl hover:bg-stone-200 transition-colors inline-block"
          >
            Clear Filters
          </Link>
        </>
      ) : (
        <>
          <p className="text-base font-semibold text-stone-900 mb-2">You haven&apos;t placed any orders yet.</p>
          <p className="text-sm text-stone-500 mb-6 max-w-sm">When you make a purchase, your order history will appear here.</p>
          <Link
            to="/collections"
            className="px-8 py-3.5 bg-black text-white text-xs font-semibold tracking-widest uppercase rounded-xl hover:bg-neutral-800 transition-colors inline-block"
          >
            Start Shopping
          </Link>
        </>
      )}
    </div>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;
  const inputClass = "w-full md:w-32 lg:w-40 px-3 py-2 text-xs bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-colors";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="order-search-form w-full md:w-auto"
      aria-label="Search orders"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="search"
          name={ORDER_FILTER_FIELDS.NAME}
          placeholder="Order #"
          aria-label="Order number"
          defaultValue={currentFilters.name || ''}
          className={inputClass}
        />
        <input
          type="search"
          name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
          placeholder="Confirmation #"
          aria-label="Confirmation number"
          defaultValue={currentFilters.confirmationNumber || ''}
          className={inputClass}
        />

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isSearching ? '...' : 'Search'}
          </button>
          {hasFilters && (
            <button
              type="button"
              disabled={isSearching}
              onClick={() => {
                setSearchParams(new URLSearchParams());
                formRef.current?.reset();
              }}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50"
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

  const statusColor =
    order.financialStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
      order.financialStatus === 'REFUNDED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
        'bg-muted text-foreground border-border';

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm mb-4 transition-all hover:shadow-md">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <Link to={`/account/orders/${btoa(order.id)}`} className="text-lg font-bold text-stone-900 hover:text-stone-600 transition-colors">
            Order #{order.number}
          </Link>
          <span className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border ${statusColor}`}>
            {order.financialStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-500">
          <p className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
            </svg>
            {new Date(order.processedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <p className="font-semibold text-stone-900 border-l border-stone-200 pl-6">
            <Money withoutTrailingZeros data={order.totalPrice} />
          </p>

          {fulfillmentStatus && (
            <p className="text-xs uppercase tracking-wider font-semibold text-stone-400 border-l border-stone-200 pl-6">
              {fulfillmentStatus}
            </p>
          )}
        </div>

        {order.confirmationNumber && (
          <p className="text-xs text-stone-400 font-mono">
            Confirmation: {order.confirmationNumber}
          </p>
        )}
      </div>

      <div className="sm:self-center shrink-0">
        <Link
          to={`/account/orders/${btoa(order.id)}`}
          className="flex items-center gap-2 px-6 py-2.5 bg-muted text-foreground text-xs font-semibold tracking-widest uppercase rounded-xl border border-border hover:bg-muted/70 transition-colors"
        >
          View Details
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
