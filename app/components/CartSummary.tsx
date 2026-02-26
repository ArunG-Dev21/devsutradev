import type { CartApiQueryFragment } from 'storefrontapi.generated';
import type { CartLayout } from '~/components/CartMain';
import { CartForm, Money, type OptimisticCart } from '@shopify/hydrogen';
import { useEffect, useRef } from 'react';
import { useFetcher, Link } from 'react-router';
import { useAside } from '~/components/Aside';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({ cart, layout }: CartSummaryProps) {
  return (
    <div
      className={`bg-white ${layout === 'aside'
        ? 'border-t border-neutral-200 px-4 py-4'
        : 'p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm'
        }`}
    >
      {/* Subtotal */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-semibold text-stone-900">Subtotal</span>
        <span className="text-base font-bold text-stone-900">
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart.cost.subtotalAmount} />
          ) : (
            '—'
          )}
        </span>
      </div>

      {/* Shipping note */}
      <p className="text-[11px] text-neutral-500 mb-6">
        Taxes and shipping calculated at checkout
      </p>

      {/* Terms checkbox — page layout only */}
      {layout === 'page' && (
        <div className="mb-6 border-y border-neutral-100 py-6">
          <div className="flex items-start gap-2.5">
            <input type="checkbox" id="terms" className="mt-0.5 rounded border-neutral-300 text-stone-900 focus:ring-stone-900 h-3.5 w-3.5 cursor-pointer" />
            <label htmlFor="terms" className="text-[11px] text-stone-500 leading-relaxed cursor-pointer select-none">
              I agree to the <a href="/policies/terms-of-service" className="underline hover:text-stone-900">terms and conditions</a> and <a href="/policies/refund-policy" className="underline hover:text-stone-900">refund policy</a>.
            </label>
          </div>
        </div>
      )}

      {/* Discount & Gift Card — page layout only; aside shows a note instead */}
      {layout === 'page' ? (
        <>
          <CartDiscounts discountCodes={cart?.discountCodes} />
          <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />
        </>
      ) : (
        <div className="mb-4 flex items-start gap-2.5 px-3 py-3 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-base leading-none mt-0.5">🏷️</span>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            <span className="font-semibold text-stone-700">Discounts &amp; gift cards</span> can be applied at Shopify checkout.
          </p>
        </div>
      )}

      {/* Checkout Button */}
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} layout={layout} />

      {/* Trust Badges for Page Layout */}
      {layout === 'page' && (
        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-4">Secure Checkout</p>
          <div className="flex items-center justify-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <svg className="w-8 h-8" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-visa"><title id="pi-visa">Visa</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" /><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" /><path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2.9.1.1.1.1.1.1m-10.3-6h-1.6l-.3 1.1-1.3 4.9c-.1.3-.2.4-.5.4h-2.6l-1.3-4.9c-.1-.3-.2-.4-.5-.4h-1.6l1.9 6h1.7l1.5-6h1.6l-1-6m8.8.1h-1.6l-.1.1c-1 0-1.2.6-1.5 1.5h1.9l-.1.3c-.6.8-1.5 1-2.5 1-.9 0-1.6-.3-1.6-.9 0-.4.3-.8 1.1-1.1s2-.6 2-1c0-.4-.4-.8-1.2-.8-1.2 0-2 .4-2.4.9l-.3.3.4 1.4c.5-.4 1.2-.7 1.8-.7.6 0 1.1.2 1.1.7 0 .3-.2.6-.9.9s-2.1.8-2.1 1.6c0 1 .8 1.5 2 1.5 1.5 0 2.6-.6 3.1-1.3l.3.2z" fill="#142688" /></svg>
            <svg className="w-8 h-8" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-master"><title id="pi-master">Mastercard</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" /><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" /><path fill="#ff5f00" d="M22 16.6c-2.8 0-5.2-1.8-6.1-4.4-.9-2.5.1-5.4 2.1-7.1 2-1.7 5-2 7.3-.6-1.8 1.1-3 3.1-3 5.4 0 2.3 1.2 4.3 3 5.4-1 .9-2.2 1.4-3.5 1.4z" /><path fill="#eb001b" d="M12.7 16.6c-2.8 0-5.2-1.8-6.1-4.4-.9-2.5.1-5.4 2.1-7.1 2-1.7 5-2 7.3-.6-1.8 1.1-3 3.1-3 5.4 0 2.3 1.2 4.3 3 5.4-1 .9-2.2 1.4-3.5 1.4z" /><path fill="#f79e1b" d="M28.4 16.6c1.3 0 2.5-.5 3.5-1.4-1.8-1.1-3-3.1-3-5.4 0-2.3 1.2-4.3 3-5.4-2.3-1.4-5.3-1.1-7.3.6-2 1.7-3 4.6-2.1 7.1.9 2.5 3.3 4.4 6.1 4.4z" /></svg>
            <svg className="w-8 h-8" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-amex"><title id="pi-amex">American Express</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" /><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" /><path fill="#0272c7" d="M3.5 19H.5L4.8 5h2.9l4.5 14h-3.3l-.9-3H4.4l-.9 3ZM4.9 13h2.3l-1.1-3.6z" /><path fill="#0176cd" d="m11.1 19 4-14h3v9.4l4.1-9.4h2.9l-4.5 9.4 4.8 4.6h-3.5l-3.3-3.3-1.3 1.4v1.9h-2.3Zm13-14h8V7h-5.5v2.2h5v2h-5v2.6h5.8V19h-8V5Z" /></svg>
            <svg className="w-8 h-8" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="4" fill="#5A31F4" /><path d="M24.7 9C23.5118 9 22.548 9.96384 22.548 11.152L22.5414 11.152L22.5414 17H25C26.1046 17 27 16.1046 27 15V11.3C27 10.0297 25.9703 9 24.7 9ZM12 17L15 8.99998L18 17H12ZM20 17H18L15 9.1L12 17H10C8.89543 17 8 16.1046 8 15V11.2C8 9.92972 9.02972 8.89998 10.3 8.89998H15H17.2L20.2 17H20Z" fill="white" /></svg>
            <svg className="w-8 h-8" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="4" fill="#F4D330" /><path d="M12.4411 11.3094C11.9059 11.3094 11.4553 11.0256 11.0188 10.7419L11.0129 10.7402C10.7042 10.5375 10.3955 10.3348 10 10.3348C10 10.3348 10 12.3664 10 13.9904C10.0211 14.5447 10.2307 15.0805 10.5982 15.516C10.9657 15.9515 11.4722 16.2625 12.0442 16.402C12.6162 16.5416 13.2238 16.5022 13.7801 16.2894C14.3364 16.0766 14.8126 15.7009 15.1396 15.213C15.4667 14.7251 15.6277 14.1499 15.5997 13.5702C15.5716 12.9906 15.3557 12.4363 14.9839 11.9866C14.6121 11.5368 14.1037 11.2148 13.5323 11.0652C12.9609 10.9157 12.356 10.9464 11.8041 11.1517L11.7513 11.171C11.666 11.2033 11.5978 11.2403 11.5306 11.277L11.5036 11.2917C11.4883 11.3 11.481 11.3 11.4725 11.3045C11.4878 11.294 11.5036 11.2847 11.5186 11.2758C11.7314 11.149 11.9442 11.0223 12.2285 11.0223C12.5925 11.0416 12.9372 11.1927 13.2033 11.4496C13.4695 11.7065 13.6406 12.0537 13.6881 12.432C13.6881 13.2505 13.13 13.9904 12.2152 13.9904C11.9702 13.9937 11.7302 13.916 11.5332 13.77L11.5284 13.7664V12.7842C11.5284 12.7842 12.0163 12.8722 12.3592 12.6366C12.6624 12.4277 12.8021 12.0392 12.6713 11.7371C12.5404 11.435 12.1804 11.285 11.8687 11.402C11.6562 11.4818 11.4764 11.6236 11.352 11.8093L12.4411 11.3094ZM28 11.3094C27.4648 11.3094 27.0142 11.0256 26.5777 10.7419L26.5718 10.7402C26.2631 10.5375 25.9544 10.3348 25.5589 10.3348C25.5589 10.3348 25.5589 12.3664 25.5589 13.9904C25.5801 14.5447 25.7896 15.0805 26.1571 15.516C26.5246 15.9515 27.0311 16.2625 27.6031 16.402C28.1751 16.5416 28.7827 16.5022 29.339 16.2894C29.8953 16.0766 30.3715 15.7009 30.6986 15.213C31.0256 14.7251 31.1866 14.1499 31.1586 13.5702C31.1306 12.9906 30.9146 12.4363 30.5428 11.9866C30.171 11.5368 29.6626 11.2148 29.0912 11.0652C28.5198 10.9157 27.9149 10.9464 27.3631 11.1517L27.3102 11.171C27.2249 11.2033 27.1567 11.2403 27.0895 11.277L27.0625 11.2917C27.0472 11.3 27.0399 11.3 27.0314 11.3045C27.0467 11.294 27.0625 11.2847 27.0775 11.2758C27.2903 11.149 27.5031 11.0223 27.7874 11.0223C28.1514 11.0416 28.4961 11.1927 28.7622 11.4496C29.0284 11.7065 29.1995 12.0537 29.247 12.432C29.247 13.2505 28.6889 13.9904 27.7741 13.9904C27.5292 13.9937 27.2892 13.916 27.0921 13.77L27.0873 13.7664V12.7842C27.0873 12.7842 27.5752 12.8722 27.9181 12.6366C28.2213 12.4277 28.361 12.0392 28.2302 11.7371C28.0994 11.435 27.7394 11.285 27.4276 11.402C27.2151 11.4818 27.0353 11.6236 26.9109 11.8093L28 11.3094ZM24.2818 10L21.7828 14.8058V14.819L19.294 10H16V17H18V12.1944C18.1756 12.3396 18.2323 12.3861 18.2721 12.4208L21.1685 14.819H22.3957V12.1944C22.5714 12.3396 22.628 12.3861 22.6678 12.4208L25.2687 14.819H26V10H24.2818Z" fill="#253B80" /></svg>
          </div>
        </div>
      )}
    </div>
  );
}

function CartCheckoutActions({ checkoutUrl, layout }: { checkoutUrl?: string, layout: CartLayout }) {
  if (!checkoutUrl) return null;
  const { close } = useAside();

  return (
    <div className="mt-3 flex flex-col gap-2">
      <a
        href={checkoutUrl}
        target="_self"
        className="block w-full py-3 text-center text-sm tracking-[0.15em] uppercase font-semibold rounded-lg no-underline transition-all duration-300 hover:opacity-90 bg-stone-900 text-white"
      >
        Checkout →
      </a>
      {layout === 'aside' && (
        <Link
          to="/cart"
          onClick={close}
          prefetch="viewport"
          className="block w-full py-3 text-center text-sm tracking-[0.15em] uppercase font-semibold rounded-lg border border-stone-200 text-stone-900 transition-all duration-300 hover:bg-stone-50"
        >
          View Cart
        </Link>
      )}
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
