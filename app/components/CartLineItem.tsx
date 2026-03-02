import type { CartLineUpdateInput } from '@shopify/hydrogen/storefront-api-types';
import { useState } from 'react';
import type { CartLayout, LineItemChildrenMap } from '~/components/CartMain';
import { CartForm, Image, type OptimisticCartLine } from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { Link } from 'react-router';
import { ProductPrice } from './ProductPrice';
import { useAside } from './Aside';
import type {
  CartApiQueryFragment,
  CartLineFragment,
} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const { id, merchandise } = line;
  const { product, title, image, selectedOptions } = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const { close } = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;

  return (
    <li
      key={id}
      className={
        layout === 'page'
          ? 'p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-border bg-card shadow-sm last:mb-0 transition-shadow hover:shadow-md'
          : 'py-4 sm:py-5 border-b border-border last:border-b-0'
      }
    >
      <div className="flex gap-3 sm:gap-4">

        {/* Product Image */}
        {image && (
          <Link
            to={lineItemUrl}
            onClick={() => layout === 'aside' && close()}
            className="flex-shrink-0"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden bg-muted border border-border">
              <Image
                alt={title}
                aspectRatio="1/1"
                data={image}
                height={80}
                loading="lazy"
                width={80}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => layout === 'aside' && close()}
            className="no-underline block"
          >
            <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug truncate hover:text-muted-foreground transition-colors">
              {product.title}
            </p>
          </Link>

          {/* Variant options */}
          {(selectedOptions || []).filter(opt => opt.value !== 'Default Title').length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {selectedOptions
                .filter(opt => opt.value !== 'Default Title')
                .map((option) => (
                  <span
                    key={option.name}
                    className="inline-block text-[10px] font-medium tracking-wide uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                  >
                    {option.value}
                  </span>
                ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-bold text-foreground">
            <ProductPrice price={line?.cost?.totalAmount} />
          </div>

          {/* Quantity controls */}
          <CartLineQuantity line={line} />
        </div>

        {/* Remove */}
        <div className="flex-shrink-0 self-start pt-0.5">
          <CartLineRemoveButton lineIds={[id]} disabled={!!line.isOptimistic} />
        </div>
      </div>

      {/* Child line items */}
      {lineItemChildren ? (
        <div className="ml-[76px] sm:ml-24 mt-2 sm:mt-3 pl-2 sm:pl-3 border-l-2 border-border">
          <p id={childrenLabelId} className="sr-only">
            Line items with {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="space-y-3">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function CartLineQuantity({ line }: { line: CartLine }) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const { id: lineId, quantity, isOptimistic } = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="flex items-center gap-0 mt-2 sm:mt-3 w-fit border border-border rounded-lg overflow-hidden">
      <CartLineUpdateButton lines={[{ id: lineId, quantity: prevQuantity }]}>
        <button
          aria-label="Decrease quantity"
          title={
            quantity <= 1
              ? 'Minimum quantity is 1'
              : `Set quantity to ${prevQuantity}`
          }
          disabled={quantity <= 1 || !!isOptimistic}
          name="decrease-quantity"
          value={prevQuantity}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-base font-light"
        >
          −
        </button>
      </CartLineUpdateButton>

      <span className="w-8 h-8 flex items-center justify-center text-xs font-bold text-foreground border-x border-border select-none">
        {quantity}
      </span>

      <CartLineUpdateButton lines={[{ id: lineId, quantity: nextQuantity }]}>
        <button
          aria-label="Increase quantity"
          title={`Set quantity to ${nextQuantity}`}
          name="increase-quantity"
          value={nextQuantity}
          disabled={!!isOptimistic}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-base font-light"
        >
          +
        </button>
      </CartLineUpdateButton>
    </div>
  );
}

function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowConfirm(true)}
        aria-label="Remove item"
        className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-rose-600 hover:bg-muted transition-all disabled:opacity-30 cursor-pointer shadow-sm border border-border"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm px-4">
          <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Remove Item?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Are you sure you want to remove this sacred ornament from your cart? You can always add it back later.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-full border border-border text-muted-foreground text-xs font-bold uppercase tracking-wider hover:bg-muted hover:text-foreground transition-colors"
                >
                  Keep It
                </button>

                <CartForm
                  fetcherKey={getUpdateKey(lineIds)}
                  route="/cart"
                  action={CartForm.ACTIONS.LinesRemove}
                  inputs={{ lineIds }}
                >
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Remove
                  </button>
                </CartForm>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{ lines }}
    >
      {children}
    </CartForm>
  );
}

function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
