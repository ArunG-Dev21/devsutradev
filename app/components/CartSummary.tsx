import type { CartApiQueryFragment } from 'storefrontapi.generated';
import type { CartLayout } from '~/components/CartMain';
import { CartForm, Money, type OptimisticCart } from '@shopify/hydrogen';
import { useEffect, useRef } from 'react';
import { useFetcher } from 'react-router';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({ cart, layout }: CartSummaryProps) {
  return (
    <div
      className={`border-t border-neutral-200 bg-white ${layout === 'aside'
        ? 'px-4 py-4'
        : 'p-6 rounded-xl border border-neutral-200'
        }`}
    >
      {/* Subtotal */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-neutral-500">Subtotal</span>
        <span className="text-sm font-semibold">
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart.cost.subtotalAmount} />
          ) : (
            '—'
          )}
        </span>
      </div>

      {/* Shipping note */}
      <p className="text-xs text-neutral-400 mb-4">
        Taxes and shipping calculated at checkout
      </p>

      {/* Discount Code */}
      <CartDiscounts discountCodes={cart?.discountCodes} />
      <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />

      {/* Checkout Button */}
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({ checkoutUrl }: { checkoutUrl?: string }) {
  if (!checkoutUrl) return null;

  return (
    <div className="mt-3">
      <a
        href={checkoutUrl}
        target="_self"
        className="block w-full py-3 text-center text-sm tracking-[0.15em] uppercase font-semibold rounded-lg no-underline transition-all duration-300 hover:opacity-90 bg-stone-900 text-white"
      >
        Checkout →
      </a>
      <p className="text-center text-xs text-neutral-400 mt-2">
        Secure checkout powered by Shopify
      </p>
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({ code }) => code) || [];

  return (
    <div className="mb-3">
      {/* Existing discount */}
      {codes.length > 0 && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 bg-stone-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-stone-700">
            <span>🎫</span>
            <code className="bg-transparent text-stone-700 text-xs">
              {codes.join(', ')}
            </code>
          </div>
          <UpdateDiscountForm>
            <button
              type="submit"
              aria-label="Remove discount"
              className="text-xs text-stone-400 hover:text-stone-600 transition cursor-pointer"
            >
              Remove
            </button>
          </UpdateDiscountForm>
        </div>
      )}

      {/* Apply discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex gap-2">
          <input
            id="discount-code-input"
            type="text"
            name="discountCode"
            placeholder="Discount code"
            className="flex-1 px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs tracking-wider uppercase bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition cursor-pointer"
          >
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
}) {
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const giftCardAddFetcher = useFetcher({ key: 'gift-card-add' });

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      giftCardCodeInput.current!.value = '';
    }
  }, [giftCardAddFetcher.data]);

  return (
    <div className="mb-3">
      {giftCardCodes && giftCardCodes.length > 0 && (
        <div className="space-y-2 mb-2">
          {giftCardCodes.map((giftCard) => (
            <RemoveGiftCardForm key={giftCard.id} giftCardId={giftCard.id}>
              <div className="flex items-center justify-between px-3 py-2 bg-stone-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-stone-700">
                  <span>🎁</span>
                  <code className="bg-transparent text-stone-700 text-xs">
                    ***{giftCard.lastCharacters}
                  </code>
                  <span className="text-xs">
                    <Money data={giftCard.amountUsed} />
                  </span>
                </div>
                <button
                  type="submit"
                  className="text-xs text-stone-400 hover:text-stone-600 transition cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </RemoveGiftCardForm>
          ))}
        </div>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div className="flex gap-2">
          <input
            type="text"
            name="giftCardCode"
            placeholder="Gift card code"
            ref={giftCardCodeInput}
            className="flex-1 px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
          />
          <button
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
            className="px-4 py-2 text-xs tracking-wider uppercase bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition disabled:opacity-50 cursor-pointer"
          >
            Apply
          </button>
        </div>
      </AddGiftCardForm>
    </div>
  );
}

function AddGiftCardForm({
  fetcherKey,
  children,
}: {
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesAdd}
    >
      {children}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  children,
}: {
  giftCardId: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}
    </CartForm>
  );
}
