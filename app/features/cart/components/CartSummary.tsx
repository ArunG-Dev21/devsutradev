import type { CartApiQueryFragment } from 'storefrontapi.generated';
import type { CartLayout } from './CartMain';
import { CartForm, Money, type OptimisticCart } from '@shopify/hydrogen';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAside } from '~/shared/components/Aside';

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
      <div className="flex items-center justify-between mb-1">
        <span className={`font-semibold text-black ${layout === 'aside' ? 'text-base' : 'text-base sm:text-lg'}`}>Subtotal</span>
        <span className={`font-medium text-black ${layout === 'aside' ? 'text-lg' : 'text-lg sm:text-xl'}`}>
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money withoutTrailingZeros data={cart.cost.subtotalAmount} />
          ) : (
            '—'
          )}
        </span>
      </div>

      {/* Shipping note */}
      <p className={`text-black text-center ${layout === 'aside' ? 'text-xs mb-2.5' : 'text-[10px] sm:text-[11px] mb-3 sm:mb-4'}`}>
        Taxes and shipping calculated at checkout
      </p>

      {/* Discount codes */}
      {layout === 'page' ? (
        <CartDiscounts discountCodes={cart?.discountCodes} cartLines={cart?.lines?.nodes as any[]} />
      ) : (
        <CartDiscountsAside cart={cart} />
      )}

      {/* Terms + Checkout as a tight unit */}
      <div className={layout === 'aside' ? '' : 'mb-1'}>
        {/* Terms checkbox */}
        <label
          htmlFor={termsId}
          className={`flex items-center gap-2 cursor-pointer select-none group ${layout === 'aside' ? 'mb-2.5 py-2 border-t border-border' : 'mb-4 sm:mb-5 py-4 sm:py-5 border-y border-border'
            }`}
        >
          <input
            type="checkbox"
            id={termsId}
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="rounded border-border text-foreground focus:ring-ring h-3.5 w-3.5 cursor-pointer accent-foreground shrink-0"
          />
          <span className={`text-muted-foreground leading-snug group-hover:text-foreground transition-colors ${layout === 'aside' ? 'text-xs' : 'text-xs'}`}>
            I agree to the{' '}
            <a href="/policies/terms-of-service" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>terms</a>
            {' & '}
            <a href="/policies/refund-policy" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>refund policy</a>
          </span>
        </label>

        {/* Checkout Button */}
        <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} layout={layout} termsAccepted={termsAccepted} />
      </div>

      {/* Payment logos */}
      <div className={`border-t border-border flex flex-col items-center ${layout === 'aside' ? 'mt-2 pt-2' : 'mt-4 pt-3'}`}>
        <div className="flex items-center justify-center flex-wrap gap-1 mt-1.5">
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
              className={`flex items-center justify-center bg-white rounded border border-gray-200 ${layout === 'aside' ? 'w-9 h-5' : 'w-11 h-6'}`}
            >
              <img
                src={icon.src}
                alt={icon.alt}
                width={28}
                height={12}
                sizes="28px"
                className={`w-auto object-contain ${layout === 'aside' ? 'max-h-2.5' : 'max-h-3'}`}
                loading="lazy"
              />
            </div>
          ))}
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
          className={`flex items-center justify-center gap-2 w-full text-center tracking-[0.12em] uppercase font-semibold rounded-lg no-underline transition-all duration-300 hover:opacity-90 bg-foreground text-background ${layout === 'aside'
            ? 'py-2 text-[11px]'
            : 'py-2.5 sm:py-3 text-[11px] sm:text-sm'
            }`}
        >
          <img src='/icons/rps.png' alt='rupees icon' width={24} height={24} sizes="24px" className='w-6 h-6 ' />
          PROCEED TO CHECKOUT
        </a>
      ) : (
        <button
          type="button"
          disabled
          className={`flex items-center justify-center gap-2 w-full text-center tracking-[0.12em] uppercase font-semibold rounded-lg bg-muted text-muted-foreground cursor-not-allowed border border-border opacity-60 ${layout === 'aside'
            ? 'py-2 text-[11px]'
            : 'py-2.5 sm:py-3 text-[11px] sm:text-sm'
            }`}
        >
          <img src='/icons/rps.png' alt='rupees icon' width={24} height={24} sizes="24px" className='w-6 h-6 ' />
          PROCEED TO CHECKOUT
        </button>
      )}

      {layout === 'aside' && (
        <Link
          to="/cart"
          onClick={close}
          prefetch="viewport"
          className="flex items-center justify-center gap-2 w-full py-2 text-center text-[11px] tracking-[0.12em] uppercase font-semibold rounded-lg border border-border text-foreground transition-all duration-200 hover:bg-muted"
        >
          <svg className='w-5 h-5' viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.9999 9.32007L19.9999 17.3201C19.8507 18.4088 19.3192 19.409 18.5003 20.1418C17.6813 20.8746 16.6285 21.2923 15.5299 21.3201H8.38992C7.29136 21.2923 6.23848 20.8746 5.41957 20.1418C4.60066 19.409 4.0691 18.4088 3.91992 17.3201L2.91992 9.32007" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 9.32004C8.81444 7.20973 15.1856 7.20973 21 9.32004" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.42969 8.34006L9.07969 3.32007" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.5699 8.34006L14.9199 3.32007" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          VIEW CART
        </Link>
      )}
    </div>
  );
}

function CartDiscounts({
  discountCodes,
  cartLines,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
  cartLines?: any[];
}) {
  const allEntries = discountCodes ?? [];
  const validCodes = allEntries.filter((d) => d.applicable).map((d) => d.code);
  const invalidCodes = allEntries.filter((d) => !d.applicable).map((d) => d.code);
  const allCodes = allEntries.map((d) => d.code);

  // Build code → offer/label map from cart lines for contextual error messages
  const couponInfoMap = useMemo(() => {
    const map: Record<string, { label?: string; offer?: string }> = {};
    for (const line of cartLines ?? []) {
      const code = (line as any)?.merchandise?.product?.coupon_code?.value as string | undefined;
      const label = (line as any)?.merchandise?.product?.coupon_label?.value as string | undefined;
      const offer = (line as any)?.merchandise?.product?.coupon_offer?.value as string | undefined;
      if (code) map[code.toUpperCase()] = { label, offer };
    }
    return map;
  }, [cartLines]);

  if (allEntries.length === 0) return null;

  return (
    <div className="mb-3 flex flex-col gap-1.5">
      {validCodes.map((code) => (
        <div key={code} className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-foreground">
            <span className="text-sm">🎫</span>
            <code className="text-xs font-mono font-semibold">{code}</code>
          </div>
          <UpdateDiscountForm discountCodes={allCodes.filter((c) => c !== code)}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground transition cursor-pointer">
              Remove
            </button>
          </UpdateDiscountForm>
        </div>
      ))}

      {invalidCodes.map((code) => {
        const info = couponInfoMap[code.toUpperCase()];
        const reason = info?.offer ?? info?.label ?? 'Not applicable to your current cart';
        return (
          <div key={code} className="flex items-start justify-between gap-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <code className="text-xs font-mono font-semibold text-red-600">{code}</code>
              </div>
              <p className="text-[10px] text-red-500 leading-snug pl-4">{reason}</p>
            </div>
            <UpdateDiscountForm discountCodes={allCodes.filter((c) => c !== code)}>
              <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition cursor-pointer shrink-0 mt-0.5">
                Remove
              </button>
            </UpdateDiscountForm>
          </div>
        );
      })}
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

// ── Aside-specific discount section ─────────────────────────────────────────

function CartDiscountsAside({
  cart,
}: {
  cart: OptimisticCart<CartApiQueryFragment | null>;
}) {
  const allEntries = cart?.discountCodes ?? [];
  const appliedCodes = useMemo(
    () => allEntries.filter((d) => d.applicable).map((d) => d.code),
    [allEntries],
  );
  const invalidCodes = useMemo(
    () => allEntries.filter((d) => !d.applicable).map((d) => d.code),
    [allEntries],
  );
  const allCodes = allEntries.map((d) => d.code);

  // Coupons suggested from products in cart (not yet applied)
  const availableCoupons = useMemo(() => {
    const seen = new Set<string>();
    const result: { code: string; label?: string }[] = [];
    for (const line of cart?.lines?.nodes ?? []) {
      const code = (line as any).merchandise?.product?.coupon_code?.value as string | undefined;
      const label = (line as any).merchandise?.product?.coupon_label?.value as string | undefined;
      if (code && !seen.has(code)) {
        seen.add(code);
        result.push({ code, label });
      }
    }
    return result;
  }, [cart?.lines?.nodes]);

  // Build code → offer map for contextual error messages
  const couponInfoMap = useMemo(() => {
    const map: Record<string, { label?: string; offer?: string }> = {};
    for (const line of cart?.lines?.nodes ?? []) {
      const code = (line as any).merchandise?.product?.coupon_code?.value as string | undefined;
      const label = (line as any).merchandise?.product?.coupon_label?.value as string | undefined;
      const offer = (line as any).merchandise?.product?.coupon_offer?.value as string | undefined;
      if (code) map[code.toUpperCase()] = { label, offer };
    }
    return map;
  }, [cart?.lines?.nodes]);

  const unapplied = availableCoupons.filter((c) => !appliedCodes.includes(c.code));

  const hasAnything = unapplied.length > 0 || appliedCodes.length > 0 || invalidCodes.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="mb-3 flex flex-col gap-1.5">
      {/* Unapplied coupons from cart products — tap to apply */}
      {unapplied.map(({ code, label }) => (
        <UpdateDiscountForm key={code} discountCodes={[...appliedCodes, code]}>
          <button
            type="submit"
            className="flex items-center justify-between w-full gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] leading-none shrink-0">🏷️</span>
              <span className="font-mono font-bold text-[11px] tracking-wide truncate">{code}</span>
              {label && (
                <span className="text-[10px] text-amber-700 truncate">— {label}</span>
              )}
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-800 rounded px-1.5 py-0.5 font-semibold shrink-0">
              Apply
            </span>
          </button>
        </UpdateDiscountForm>
      ))}

      {/* Applied valid codes */}
      {appliedCodes.map((code) => (
        <div key={code} className="flex items-center justify-between px-2.5 py-1.5 bg-muted rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">🎫</span>
            <code className="font-mono font-semibold text-[11px] text-foreground">{code}</code>
          </div>
          <UpdateDiscountForm discountCodes={allCodes.filter((c) => c !== code)}>
            <button type="submit" className="text-[10px] text-muted-foreground hover:text-foreground transition cursor-pointer">
              Remove
            </button>
          </UpdateDiscountForm>
        </div>
      ))}

      {/* Invalid codes with contextual reason */}
      {invalidCodes.map((code) => {
        const info = couponInfoMap[code.toUpperCase()];
        const reason = info?.offer ?? info?.label ?? 'Not applicable to your current cart';
        return (
          <div key={code} className="flex items-start justify-between gap-2 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <code className="font-mono font-semibold text-[11px] text-red-600">{code}</code>
              </div>
              <p className="text-[10px] text-red-500 leading-snug pl-4">{reason}</p>
            </div>
            <UpdateDiscountForm discountCodes={allCodes.filter((c) => c !== code)}>
              <button type="submit" className="text-[10px] text-red-400 hover:text-red-600 transition cursor-pointer shrink-0 mt-0.5">
                Remove
              </button>
            </UpdateDiscountForm>
          </div>
        );
      })}
    </div>
  );
}
