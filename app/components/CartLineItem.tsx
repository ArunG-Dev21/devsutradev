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
    <li key={id} className="py-5 border-b border-stone-100 last:border-b-0">
      <div className="flex gap-4">

        {/* Product Image */}
        {image && (
          <Link
            to={lineItemUrl}
            onClick={() => layout === 'aside' && close()}
            className="flex-shrink-0"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
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
            <p className="text-sm font-semibold text-stone-900 leading-snug truncate hover:text-stone-600 transition-colors">
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
                    className="inline-block text-[10px] font-medium tracking-wide uppercase text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full"
                  >
                    {option.value}
                  </span>
                ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-2 text-sm font-bold text-stone-900">
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
        <div className="ml-24 mt-3 pl-3 border-l-2 border-stone-100">
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
    <div className="flex items-center gap-0 mt-3 w-fit border border-stone-200 rounded-lg overflow-hidden">
      <CartLineUpdateButton lines={[{ id: lineId, quantity: prevQuantity }]}>
        <button
          aria-label="Decrease quantity"
          disabled={quantity <= 1 || !!isOptimistic}
          name="decrease-quantity"
          value={prevQuantity}
          className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-base font-light"
        >
          −
        </button>
      </CartLineUpdateButton>

      <span className="w-8 h-8 flex items-center justify-center text-xs font-bold text-stone-900 border-x border-stone-200 select-none">
        {quantity}
      </span>

      <CartLineUpdateButton lines={[{ id: lineId, quantity: nextQuantity }]}>
        <button
          aria-label="Increase quantity"
          name="increase-quantity"
          value={nextQuantity}
          disabled={!!isOptimistic}
          className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-base font-light"
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
        aria-label="Remove item"
        className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 hover:text-stone-900 hover:bg-stone-100 transition-all disabled:opacity-30 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-3.5 h-3.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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