import { useOptimisticCart, type OptimisticCartLine } from '@shopify/hydrogen';
import { Link } from 'react-router';
import type { CartApiQueryFragment } from 'storefrontapi.generated';
import { useAside } from '~/components/Aside';
import { CartLineItem, type CartLine } from '~/components/CartLineItem';
import { CartSummary } from './CartSummary';
import { FREE_SHIPPING_THRESHOLD } from '~/lib/constants';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = { [parentId: string]: CartLine[] };

function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const children = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(children)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

export function CartMain({ layout, cart: originalCart }: CartMainProps) {
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount || '0');
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className="h-full flex flex-col bg-white">

      {/* Free Shipping Progress — aside only */}
      {layout === 'aside' && cartHasItems && (
        <div className="px-5 py-3.5 bg-white border-b border-gray-200">
          {remaining > 0 ? (
            <>
              <p className="text-[11px] text-stone-500 mb-2 tracking-wide">
                Add{' '}
                <span className="font-bold text-stone-900">₹{remaining.toFixed(0)}</span>
                {' '}more for free shipping
              </p>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-900 rounded-full transition-all duration-500"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-[11px] font-semibold text-stone-900 tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[9px]">✓</span>
              You qualify for free shipping!
            </p>
          )}
        </div>
      )}

      {/* Cart Lines */}
      <div className={`flex-1 overflow-y-auto ${layout === 'aside' ? 'px-5' : ''}`}>
        <CartEmpty hidden={linesCount} layout={layout} />
        <ul>
          {(cart?.lines?.nodes ?? []).map((line) => {
            if (
              'parentRelationship' in line &&
              line.parentRelationship?.parent
            ) {
              return null;
            }
            return (
              <CartLineItem
                key={line.id}
                line={line}
                layout={layout}
                childrenMap={childrenMap}
              />
            );
          })}
        </ul>
      </div>

      {/* Summary */}
      {cartHasItems && <CartSummary cart={cart} layout={layout} />}
    </div>
  );
}

function CartEmpty({
  hidden = false,
  layout,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const { close } = useAside();
  return (
    <div hidden={hidden} className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
        </svg>
      </div>

      <p className="text-base font-semibold text-stone-900 mb-1">Your cart is empty</p>
      <p className="text-xs text-stone-400 mb-8 leading-relaxed">
        Looks like you haven&rsquo;t added anything yet
      </p>

      <Link
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
        className="no-underline inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold tracking-widest uppercase rounded-xl hover:bg-stone-700 transition-colors duration-200"
      >
        Start Shopping
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}