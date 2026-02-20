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

/**
 * Cart main component — redesigned for aside layout with free shipping bar.
 */
export function CartMain({ layout, cart: originalCart }: CartMainProps) {
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  // Calculate free shipping progress
  const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount || '0');
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className={`h-full flex flex-col ${layout === 'aside' ? '' : ''}`}>
      {/* Free Shipping Progress Bar (aside only) */}
      {layout === 'aside' && cartHasItems && (
        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
          {remaining > 0 ? (
            <>
              <p className="text-xs text-neutral-500 mb-2">
                Add ₹{remaining.toFixed(0)} more for{' '}
                <span className="font-semibold text-green-600">free shipping</span>
              </p>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${shippingProgress}%`,
                    backgroundColor: '#C5A355',
                  }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              🎉 You qualify for free shipping!
            </p>
          )}
        </div>
      )}

      {/* Cart Lines */}
      <div className={`flex-1 overflow-y-auto ${layout === 'aside' ? 'px-4' : ''}`}>
        <CartEmpty hidden={linesCount} layout={layout} />
        <ul className="divide-y divide-neutral-100">
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
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const { close } = useAside();
  return (
    <div hidden={hidden} className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">🛒</div>
      <p className="text-lg font-medium mb-2">Your cart is empty</p>
      <p className="text-sm text-neutral-400 mb-6">
        Looks like you haven&rsquo;t added anything yet
      </p>
      <Link
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
        className="px-6 py-2.5 text-sm tracking-wider uppercase rounded-full no-underline transition-all duration-300 hover:opacity-90"
        style={{ backgroundColor: '#C5A355', color: '#fff' }}
      >
        Start Shopping →
      </Link>
    </div>
  );
}
