import type { CartApiQueryFragment } from 'storefrontapi.generated';
import type { CartLayout } from '~/components/CartMain';
import { CartForm, Money, type OptimisticCart } from '@shopify/hydrogen';
import { useEffect, useRef, useState } from 'react';
import { useFetcher, Link } from 'react-router';
import { useAside } from '~/components/Aside';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({ cart, layout }: CartSummaryProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const termsId = layout === 'aside' ? 'terms-aside' : 'terms-page';

  return (
    <div
      className={`text-card-foreground ${layout === 'aside'
        ? 'bg-card border-t border-border px-4 py-3'
        : 'lg:pl-8'
        }`}
    >
      {/* Subtotal */}
      <div className="flex items-center justify-between mb-0.5">
        <span className={`font-semibold text-foreground ${layout === 'aside' ? 'text-sm' : 'text-sm sm:text-base'}`}>Subtotal</span>
        <span className={`font-bold text-foreground ${layout === 'aside' ? 'text-sm' : 'text-sm sm:text-base'}`}>
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money withoutTrailingZeros data={cart.cost.subtotalAmount} />
          ) : (
            '—'
          )}
        </span>
      </div>

      {/* Shipping note */}
      <p className={`text-muted-foreground ${layout === 'aside' ? 'text-[10px] mb-2.5' : 'text-[10px] sm:text-[11px] mb-3 sm:mb-4'}`}>
        Taxes and shipping calculated at checkout
      </p>

      {/* Discount & Gift Card — page layout only; aside shows a note */}
      {layout === 'page' ? (
        <>
          <CartDiscounts discountCodes={cart?.discountCodes} />
          <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />
        </>
      ) : (
        <div className="mb-2.5 flex items-center gap-2 px-2.5 py-2 bg-muted/50 rounded-lg">
          <span className="text-xs leading-none">🏷️</span>
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">Discount codes</span> applied at checkout
          </p>
        </div>
      )}

      {/* Terms + Checkout as a tight unit */}
      <div className={layout === 'aside' ? '' : 'mb-1'}>
        {/* Terms checkbox */}
        <label
          htmlFor={termsId}
          className={`flex items-center gap-2 cursor-pointer select-none group ${
            layout === 'aside' ? 'mb-2.5 py-2 border-t border-border' : 'mb-4 sm:mb-5 py-4 sm:py-5 border-y border-border'
          }`}
        >
          <input
            type="checkbox"
            id={termsId}
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="rounded border-border text-foreground focus:ring-ring h-3.5 w-3.5 cursor-pointer accent-foreground shrink-0"
          />
          <span className={`text-muted-foreground leading-snug group-hover:text-foreground transition-colors ${layout === 'aside' ? 'text-[10px]' : 'text-[11px]'}`}>
            I agree to the{' '}
            <a href="/policies/terms-of-service" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>terms</a>
            {' & '}
            <a href="/policies/refund-policy" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>refund policy</a>
          </span>
        </label>

        {/* Checkout Button */}
        <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} layout={layout} termsAccepted={termsAccepted} />
      </div>

      {/* Payment logos + powered by line */}
      <div className={`border-t border-border flex flex-col items-center ${layout === 'aside' ? 'mt-2.5 pt-2.5' : 'mt-5 sm:mt-7 pt-4 sm:pt-5'}`}>
        <div className={`flex items-center justify-center flex-wrap ${layout === 'aside' ? 'gap-2 mb-1.5' : 'gap-2 sm:gap-3 mb-3'}`}>
          <div className="flex flex-col items-center gap-2 mt-3">

  {/* Payment Icons */}
  <div className="flex items-center max-w-75 justify-center gap-2 flex-wrap">

    {[
      { src: "/icons/UPI.svg", alt: "UPI" },
      { src: "/icons/PhonePe.svg", alt: "PhonePe" },
      { src: "/icons/visa.svg", alt: "Visa" },
      { src: "/icons/mastercard.svg", alt: "Mastercard" },
      { src: "/icons/RuPay.svg", alt: "RuPay" },
      { src: "/icons/netbanking.svg", alt: "Net Banking" },
      { src: "/icons/paytm.svg", alt: "Paytm" },
    ].map((icon) => (
      <div
        key={icon.alt}
        className="w-16 h-8 flex items-center justify-center bg-white rounded-md border border-gray-200"
      >
        <img
          src={icon.src}
          alt={icon.alt}
          className="max-h-4 w-auto object-contain"
          loading="lazy"
        />
      </div>
    ))}

  </div>

</div>
        </div>
      </div>
    </div>
  );
}

function CartCheckoutActions({
  checkoutUrl,
  layout,
  termsAccepted,
}: {
  checkoutUrl?: string;
  layout: CartLayout;
  termsAccepted: boolean;
}) {
  const { close } = useAside();
  if (!checkoutUrl) return null;

  return (
    <div className="flex flex-col gap-2">
      {termsAccepted ? (
        <a
          href={checkoutUrl}
          target="_self"
          className={`block w-full text-center tracking-[0.15em] uppercase font-semibold rounded-lg no-underline transition-all duration-300 hover:opacity-90 bg-foreground text-background ${
            layout === 'aside' ? 'py-2.5 text-xs' : 'py-2.5 sm:py-3 text-xs sm:text-sm'
          }`}
        >
          BUY NOW
        </a>
      ) : (
        <button
          type="button"
          disabled
          className={`w-full text-center tracking-[0.15em] uppercase font-semibold rounded-lg bg-muted text-muted-foreground cursor-not-allowed border border-border opacity-60 ${
            layout === 'aside' ? 'py-2.5 text-xs' : 'py-2.5 sm:py-3 text-xs sm:text-sm'
          }`}
        >
          BUY NOW
        </button>
      )}
      {layout === 'aside' && (
        <Link
          to="/cart"
          onClick={close}
          prefetch="viewport"
          className="block w-full py-2 text-center text-[11px] tracking-[0.12em] uppercase font-semibold rounded-lg border border-border text-foreground transition-all duration-200 hover:bg-muted"
        >
          VIEW MY CART
        </Link>
      )}
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
        <div className="flex items-center justify-between mb-2 px-3 py-2 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span>🎫</span>
            <code className="bg-transparent text-foreground text-xs">
              {codes.join(', ')}
            </code>
          </div>
          <UpdateDiscountForm>
            <button
              type="submit"
              aria-label="Remove discount"
              className="text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
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
            className="flex-1 px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs tracking-wider uppercase bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-300 transition cursor-pointer"
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
              <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg text-sm">
                <div className="flex items-center gap-2 text-stone-700">
                  <span>🎁</span>
                  <code className="bg-transparent text-stone-700 text-xs">
                    ***{giftCard.lastCharacters}
                  </code>
                  <span className="text-xs">
                    <Money withoutTrailingZeros data={giftCard.amountUsed} />
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
            className="flex-1 px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
          <button
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
            className="px-4 py-2 text-xs tracking-wider uppercase bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-300 transition disabled:opacity-50 cursor-pointer"
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
