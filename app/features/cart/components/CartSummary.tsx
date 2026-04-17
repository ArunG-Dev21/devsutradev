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

  if (layout === 'aside') {
    return (
      <div className="flex gap-2">
        {/* Checkout — 3/4 width */}
        {termsAccepted ? (
          <a
            href={checkoutUrl}
            target="_self"
            className="flex-[3] flex items-center justify-center gap-2 py-1.5 text-center text-[11px] tracking-[0.12em] uppercase font-semibold rounded-lg no-underline transition-all duration-300 hover:opacity-90 bg-foreground text-background"
          >
            <img src='/icons/rps.png' alt='' width={20} height={20} className='w-5 h-5 shrink-0' />
            Checkout
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex-[3] flex items-center justify-center gap-2 py-1.5 text-center text-[11px] tracking-[0.12em] uppercase font-semibold rounded-lg bg-muted text-muted-foreground cursor-not-allowed border border-border opacity-60"
          >
            <img src='/icons/rps.png' alt='' width={20} height={20} className='w-5 h-5 shrink-0' />
            Checkout
          </button>
        )}

        {/* View bag — 1/4 width */}
        <Link
          to="/cart"
          onClick={close}
          prefetch="viewport"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-center rounded-lg border border-border text-foreground transition-all duration-200 hover:bg-muted"
          aria-label="View cart"
        >
          <svg className='w-5 h-5' viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.9999 9.32007L19.9999 17.3201C19.8507 18.4088 19.3192 19.409 18.5003 20.1418C17.6813 20.8746 16.6285 21.2923 15.5299 21.3201H8.38992C7.29136 21.2923 6.23848 20.8746 5.41957 20.1418C4.60066 19.409 4.0691 18.4088 3.91992 17.3201L2.91992 9.32007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 9.32004C8.81444 7.20973 15.1856 7.20973 21 9.32004" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.42969 8.34006L9.07969 3.32007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.5699 8.34006L14.9199 3.32007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[9px] tracking-[0.12em] uppercase font-semibold">View</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {termsAccepted ? (
        <a
          href={checkoutUrl}
          target="_self"
          className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 text-center text-[11px] sm:text-sm tracking-[0.12em] uppercase font-semibold rounded-lg no-underline transition-all duration-300 hover:opacity-90 bg-foreground text-background"
        >
          <img src='/icons/rps.png' alt='' width={24} height={24} className='w-6 h-6' />
          PROCEED TO CHECKOUT
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 text-center text-[11px] sm:text-sm tracking-[0.12em] uppercase font-semibold rounded-lg bg-muted text-muted-foreground cursor-not-allowed border border-border opacity-60"
        >
          <img src='/icons/rps.png' alt='' width={24} height={24} className='w-6 h-6' />
          PROCEED TO CHECKOUT
        </button>
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
    <div className="mb-3 flex flex-col gap-2">
      {/* Applied valid codes */}
      {validCodes.map((code) => (
        <div key={code} className="flex items-center justify-between px-3 py-2.5 bg-black rounded-xl">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#F14514] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <code className="font-mono font-bold text-xs tracking-widest text-[#F14514]">{code}</code>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#F14514]">applied</span>
          </div>
          <UpdateDiscountForm discountCodes={allCodes.filter((c) => c !== code)}>
            <button type="submit" className="text-[10px] text-white/40 hover:text-white/80 transition cursor-pointer">
              Remove
            </button>
          </UpdateDiscountForm>
        </div>
      ))}

      {/* Invalid codes */}
      {invalidCodes.map((code) => {
        const info = couponInfoMap[code.toUpperCase()];
        const reason = info?.offer ?? info?.label ?? 'Not applicable to your current cart';
        return (
          <div key={code} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-zinc-950 border border-red-900/60 rounded-xl">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <code className="text-xs font-mono font-bold text-red-400">{code}</code>
              </div>
              <p className="text-[10px] text-red-500/80 leading-snug pl-[18px]">{reason}</p>
            </div>
            <UpdateDiscountForm discountCodes={allCodes.filter((c) => c !== code)}>
              <button type="submit" className="text-[10px] text-red-500/60 hover:text-red-400 transition cursor-pointer shrink-0 mt-0.5">
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
    const result: { code: string; label?: string; offer?: string }[] = [];
    for (const line of cart?.lines?.nodes ?? []) {
      const code = (line as any).merchandise?.product?.coupon_code?.value as string | undefined;
      const label = (line as any).merchandise?.product?.coupon_label?.value as string | undefined;
      const offer = (line as any).merchandise?.product?.coupon_offer?.value as string | undefined;
      if (code && !seen.has(code)) {
        seen.add(code);
        result.push({ code, label, offer });
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
    <div className="mb-3 flex flex-col gap-2">
      {/* Unapplied coupons — mini ticket, tap to apply */}
      {unapplied.map(({ code, label, offer }) => (
        <UpdateDiscountForm key={code} discountCodes={[...appliedCodes, code]}>
          <button
            type="submit"
            className="relative flex items-stretch w-full rounded-xl bg-black hover:bg-zinc-900 transition cursor-pointer"
          >
            {/* Notches */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white z-10" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white z-10" />

            {/* Icon */}
            <div className="flex items-center px-3 py-3 shrink-0">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
              </div>
            </div>

            {/* Dashed divider */}
            <div className="self-stretch w-0 border-l border-dashed border-white/40" />

            {/* Text zone: [label+code LEFT] [offer flows MIDDLE] [Apply RIGHT] */}
            <div className="flex-1 flex items-stretch gap-2 px-2.5 py-2.5 min-w-0">

              {/* Left: label + code stacked */}
              <div className="flex flex-col justify-center gap-0.5 shrink-0">
                {label && (
                  <p className="coupon-label-animated text-[10px] font-semibold leading-tight">{label}</p>
                )}
                <span className="font-mono font-bold text-[11px] tracking-widest text-white/90 border border-dashed border-white/40 rounded px-1.5 py-0.5 self-start">{code}</span>
              </div>

              {/* Middle: offer flows across the full height of the left column */}
              {offer && (
                <div className="flex-1 overflow-hidden flex items-center min-w-0">
                  <div className="flex whitespace-nowrap animate-[cart-ticker_6s_linear_infinite]">
                    <span className="text-[10px] text-white/60 pr-8">{offer}</span>
                    <span className="text-[10px] text-white/60 pr-8" aria-hidden="true">{offer}</span>
                  </div>
                </div>
              )}

              {/* Right: Apply */}
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[#F14514] text-white rounded px-1.5 py-1 shrink-0 self-center">
                Apply
              </span>
            </div>
          </button>
        </UpdateDiscountForm>
      ))}

      {/* Applied valid codes */}
      {appliedCodes.map((code) => (
        <div key={code} className="flex items-center justify-between px-3 py-2.5 bg-black rounded-xl">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#F14514] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <code className="font-mono font-bold text-[11px] tracking-widest text-[#F14514]">{code}</code>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#F14514]">applied</span>
          </div>
          <UpdateDiscountForm discountCodes={allCodes.filter((c) => c !== code)}>
            <button type="submit" className="text-[10px] text-white/40 hover:text-white/80 transition cursor-pointer">
              Remove
            </button>
          </UpdateDiscountForm>
        </div>
      ))}

      {/* Invalid codes */}
      {invalidCodes.map((code) => {
        const info = couponInfoMap[code.toUpperCase()];
        const reason = info?.offer ?? info?.label ?? 'Not applicable to your current cart';
        return (
          <div key={code} className="flex items-start justify-between gap-2 px-3 py-2.5 bg-zinc-950 border border-red-900/60 rounded-xl">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <code className="font-mono font-bold text-[11px] text-red-400">{code}</code>
              </div>
              <p className="text-[10px] text-red-500/80 leading-snug pl-[18px]">{reason}</p>
            </div>
            <UpdateDiscountForm discountCodes={allCodes.filter((c) => c !== code)}>
              <button type="submit" className="text-[10px] text-red-500/60 hover:text-red-400 transition cursor-pointer shrink-0 mt-0.5">
                Remove
              </button>
            </UpdateDiscountForm>
          </div>
        );
      })}
    </div>
  );
}
