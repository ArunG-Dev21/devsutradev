import type { CartLineUpdateInput } from '@shopify/hydrogen/storefront-api-types';
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

/**
 * Redesigned cart line item with improved styling.
 */
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
    <li key={id} className="py-4">
      <div className="flex gap-4">
        {/* Product Image */}
        {image && (
          <Link
            to={lineItemUrl}
            onClick={() => layout === 'aside' && close()}
            className="flex-shrink-0"
          >
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              height={80}
              loading="lazy"
              width={80}
              className="rounded-lg object-cover"
            />
          </Link>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => layout === 'aside' && close()}
            className="no-underline"
          >
            <p className="text-sm font-medium text-neutral-800 truncate">
              {product.title}
            </p>
          </Link>

          {/* Options */}
          {selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.name}
                  className="text-[11px] text-neutral-400"
                >
                  {option.name}: {option.value}
                  {selectedOptions.indexOf(option) < selectedOptions.length - 1
                    ? ' · '
                    : ''}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-2 text-sm font-semibold" style={{ color: '#C5A355' }}>
            <ProductPrice price={line?.cost?.totalAmount} />
          </div>

          {/* Quantity Controls */}
          <CartLineQuantity line={line} />
        </div>

        {/* Remove Button */}
        <div className="flex-shrink-0 self-start">
          <CartLineRemoveButton
            lineIds={[id]}
            disabled={!!line.isOptimistic}
          />
        </div>
      </div>

      {/* Children line components */}
      {lineItemChildren ? (
        <div className="ml-20 mt-2">
          <p id={childrenLabelId} className="sr-only">
            Line items with {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="space-y-2">
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

/**
 * Quantity controls with styled +/- buttons.
 */
function CartLineQuantity({ line }: { line: CartLine }) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const { id: lineId, quantity, isOptimistic } = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="flex items-center gap-2 mt-2">
      <CartLineUpdateButton lines={[{ id: lineId, quantity: prevQuantity }]}>
        <button
          aria-label="Decrease quantity"
          disabled={quantity <= 1 || !!isOptimistic}
          name="decrease-quantity"
          value={prevQuantity}
          className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center text-sm hover:border-neutral-400 transition disabled:opacity-30 cursor-pointer"
        >
          −
        </button>
      </CartLineUpdateButton>

      <span className="text-sm font-medium w-6 text-center">{quantity}</span>

      <CartLineUpdateButton lines={[{ id: lineId, quantity: nextQuantity }]}>
        <button
          aria-label="Increase quantity"
          name="increase-quantity"
          value={nextQuantity}
          disabled={!!isOptimistic}
          className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center text-sm hover:border-neutral-400 transition disabled:opacity-30 cursor-pointer"
        >
          +
        </button>
      </CartLineUpdateButton>
    </div>
  );
}

/**
 * Remove button — small trash icon.
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
    >
      <button
        disabled={disabled}
        type="submit"
        className="p-1 text-neutral-300 hover:text-red-500 transition cursor-pointer"
        aria-label="Remove item"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </CartForm>
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
