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
  if (!params.id) return redirect('/account/orders');

  const orderId = atob(params.id);
  const { data, errors }: { data: OrderQuery; errors?: Array<{ message: string }> } =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: { orderId, language: customerAccount.i18n.language },
    });

  if (errors?.length || !data?.order) throw new Error('Order not found');

  const { order } = data;
  const lineItems = order.lineItems.nodes;
  const discountApplications = order.discountApplications.nodes;
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';
  const firstDiscount = discountApplications[0]?.value;

  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<typeof firstDiscount, { __typename: 'MoneyV2' }>)
      : null;

  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (firstDiscount as Extract<typeof firstDiscount, { __typename: 'PricingPercentageValue' }>).percentage
      : null;

  return { order, lineItems, discountValue, discountPercentage, fulfillmentStatus };
}

export default function OrderRoute() {
  const { order, lineItems, discountValue, discountPercentage, fulfillmentStatus } =
    useLoaderData<typeof loader>();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-border">
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6 uppercase tracking-widest"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Orders
        </Link>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-heading font-medium text-foreground tracking-tight">
            {order.name}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5 text-sm text-muted-foreground">
            <span>
              {new Intl.DateTimeFormat('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
              }).format(new Date(order.processedAt!))}
            </span>
            {order.confirmationNumber && (
              <>
                <span className="w-1 h-1 rounded-full bg-border inline-block" />
                <span className="font-mono text-xs">#{order.confirmationNumber}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <a
            target="_blank"
            href={order.statusPageUrl}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-[11px] font-semibold tracking-widest uppercase rounded-full hover:opacity-85 transition-opacity"
          >
            Track Shipment
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line items */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-foreground">
                Items Ordered
              </h3>
            </div>

            <div className="divide-y divide-border">
              {lineItems.map((lineItem, i) => (
                <OrderLineRow key={i} lineItem={lineItem} />
              ))}
            </div>

            <div className="px-5 py-5 border-t border-border bg-muted/20">
              <div className="space-y-2.5 text-sm">
                {((discountValue && discountValue.amount) || discountPercentage) && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>
                      {discountPercentage ? (
                        `-${discountPercentage}% OFF`
                      ) : (
                        discountValue && <Money className="font-montserrat" withoutTrailingZeros data={discountValue!} />
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span><Money className="font-montserrat" withoutTrailingZeros data={order.subtotal!} /></span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span><Money className="font-montserrat" withoutTrailingZeros data={order.totalTax!} /></span>
                </div>
                <div className="pt-3 mt-1 border-t border-border flex justify-between items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground">Total</span>
                  <span className="text-xl font-medium text-foreground">
                    <Money className="font-montserrat" withoutTrailingZeros data={order.totalPrice!} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-foreground mb-4">
              Shipping Address
            </h3>
            {order?.shippingAddress ? (
              <address className="not-italic text-sm text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">{order.shippingAddress.name}</p>
                {order.shippingAddress.formatted?.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">No shipping address provided.</p>
            )}
          </div>

          <div className="rounded-2xl border border-border p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-foreground mb-4">
              Fulfillment Status
            </h3>
            <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
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
  const currencyCode = lineItem.price?.currencyCode || lineItem.totalDiscount?.currencyCode;

  const totalMoney = currencyCode ? { amount: totalAfterDiscount.toFixed(2), currencyCode } : null;
  const beforeMoney = currencyCode ? { amount: totalBeforeDiscount.toFixed(2), currencyCode } : null;

  return (
    <div className="p-5 flex gap-4 items-start">
      <div className="shrink-0">
        {lineItem?.image ? (
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted">
            <Image
              data={lineItem.image}
              width={80}
              height={80}
              sizes="80px"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-muted flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm leading-snug">{lineItem.title}</p>
        {lineItem.variantTitle && lineItem.variantTitle !== 'Default Title' && (
          <p className="text-xs text-muted-foreground mt-0.5">{lineItem.variantTitle}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1.5">Qty: {lineItem.quantity}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold text-foreground text-sm">
          {totalMoney ? <Money className="font-montserrat" withoutTrailingZeros data={totalMoney} /> : null}
        </p>
        {totalDiscountAmount > 0 && beforeMoney && (
          <p className="text-xs text-muted-foreground line-through mt-0.5">
            <Money className="font-montserrat" withoutTrailingZeros data={beforeMoney} />
          </p>
        )}
      </div>
    </div>
  );
}
