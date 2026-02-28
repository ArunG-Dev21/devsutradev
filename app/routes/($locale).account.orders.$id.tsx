import { redirect, useLoaderData, Link } from 'react-router';
import type { Route } from './+types/($locale).account.orders.$id';
import { Money, Image } from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import { CUSTOMER_ORDER_QUERY } from '~/graphql/customer-account/CustomerOrderQuery';

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: `Order ${data?.order?.name}` }];
};

export async function loader({ params, context }: Route.LoaderArgs) {
  const { customerAccount } = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const { data, errors }: { data: OrderQuery; errors?: Array<{ message: string }> } =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const { order } = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
        typeof firstDiscount,
        { __typename: 'MoneyV2' }
      >)
      : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
        firstDiscount as Extract<
          typeof firstDiscount,
          { __typename: 'PricingPercentageValue' }
        >
      ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl">
      <div className="mb-8 border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4 uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Orders
          </Link>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Order {order.name}</h2>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <p>{new Date(order.processedAt!).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            {order.confirmationNumber && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <p className="font-mono text-xs text-muted-foreground">Confirmation: {order.confirmationNumber}</p>
              </>
            )}
          </div>
        </div>

        <a
          target="_blank"
          href={order.statusPageUrl}
          rel="noreferrer"
          className="px-6 py-2.5 bg-black text-white text-xs font-semibold tracking-widest uppercase rounded-xl hover:bg-neutral-800 transition-colors text-center inline-block"
        >
          Track Shipment
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Order Items</h3>
            </div>

            <div className="divide-y divide-border">
              {lineItems.map((lineItem, lineItemIndex) => (
                <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
              ))}
            </div>

            <div className="px-6 py-6 bg-muted/30">
              <div className="space-y-3 text-sm">
                {((discountValue && discountValue.amount) || discountPercentage) && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <p>Discount</p>
                    <p>
                      {discountPercentage ? (
                        <span>-{discountPercentage}% OFF</span>
                      ) : (
                        discountValue && <Money data={discountValue!} />
                      )}
                    </p>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <p>Subtotal</p>
                  <p><Money data={order.subtotal!} /></p>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <p>Tax</p>
                  <p><Money data={order.totalTax!} /></p>
                </div>
                <div className="pt-4 mt-4 border-t border-border flex justify-between items-center">
                  <p className="text-base font-bold text-foreground">Total</p>
                  <p className="text-xl font-bold text-foreground"><Money data={order.totalPrice!} /></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Shipping Address</h3>
            {order?.shippingAddress ? (
              <address className="not-italic text-sm text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground mb-2">{order.shippingAddress.name}</p>
                {order.shippingAddress.formatted ? (
                  order.shippingAddress.formatted.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))
                ) : (
                  ''
                )}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground italic">No shipping address provided.</p>
            )}
          </div>

          <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Fulfillment Status</h3>
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {fulfillmentStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderLineRow({ lineItem }: { lineItem: OrderLineItemFullFragment }) {
  const unitPriceAmount = Number(lineItem.price?.amount ?? 0);
  const totalBeforeDiscount = unitPriceAmount * Number(lineItem.quantity ?? 0);
  const totalDiscountAmount = Number(lineItem.totalDiscount?.amount ?? 0);
  const totalAfterDiscount = Math.max(totalBeforeDiscount - totalDiscountAmount, 0);
  const currencyCode =
    lineItem.price?.currencyCode || lineItem.totalDiscount?.currencyCode;

  const totalMoney =
    currencyCode
      ? { amount: totalAfterDiscount.toFixed(2), currencyCode }
      : null;
  const beforeMoney =
    currencyCode
      ? { amount: totalBeforeDiscount.toFixed(2), currencyCode }
      : null;

  return (
    <div className="p-6 flex flex-col sm:flex-row gap-6">
      <div className="shrink-0">
        {lineItem?.image ? (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted border border-border">
            <Image data={lineItem.image} width={96} height={96} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted border border-border flex items-center justify-center">
            <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="font-semibold text-foreground text-base">{lineItem.title}</p>
        {lineItem.variantTitle && lineItem.variantTitle !== 'Default Title' && (
          <p className="text-sm text-muted-foreground mt-1">{lineItem.variantTitle}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">Qty: {lineItem.quantity}</p>
      </div>

      <div className="sm:text-right flex flex-col justify-center">
        <p className="font-bold text-foreground text-lg">
          {totalMoney ? <Money data={totalMoney} /> : null}
        </p>
        {totalDiscountAmount > 0 && beforeMoney ? (
          <p className="text-xs text-stone-400 line-through mt-1">
            <Money data={beforeMoney} />
          </p>
        ) : null}
      </div>
    </div>
  );
}
