import type { CartLineUpdateInput } from '@shopify/hydrogen/storefront-api-types';
import { useState } from 'react';
import type { CartLayout, LineItemChildrenMap } from './CartMain';
import { CartForm, Image, Money, type OptimisticCartLine } from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { Link } from 'react-router';
import { useAside } from '~/shared/components/Aside';
import { StarRating } from '~/shared/components/StarRating';
import type { CartApiQueryFragment, CartLineFragment } from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

export function CartLineItem({
  layout,
  line,
  childrenMap,
  reviewSummary,
  isSelected,
  onToggleSelection,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
  reviewSummary?: { averageRating: number; reviewCount: number };
  isSelected?: boolean;
  onToggleSelection?: (checked: boolean) => void;
}) {
  const { id, merchandise } = line;
  const productHandle = merchandise?.product?.handle ?? '';
  const selectedOptions = merchandise?.selectedOptions;

  // Hooks must run unconditionally — call them before any early return.
  const lineItemUrl = useVariantUrl(productHandle, selectedOptions);
  const { close } = useAside();

  // Optimistic lines from useOptimisticCart may not have full merchandise data.
  // Skip rendering if essential product info is missing to prevent crashes.
  if (!merchandise?.product?.handle) {
    return null;
  }

  const { product, title, image } = merchandise;
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;
  const visibleOptions = (selectedOptions || []).filter(
    (opt) => opt.value !== 'Default Title',
  );
  const mmOption = visibleOptions.find((option) =>
    /mm/i.test(`${option.name} ${option.value}`),
  );
  const inlineOptions = visibleOptions.filter((option) => option !== mmOption);

  const totalAmount = parseFloat(line?.cost?.totalAmount?.amount || '0');
  const compareAtUnitAmount = parseFloat(line?.cost?.compareAtAmountPerQuantity?.amount || '0');
  const quantity = line?.quantity || 1;
  const compareAtTotal = compareAtUnitAmount * quantity;

  const hasDiscount = compareAtTotal > totalAmount;
  const discountPercentage = hasDiscount 
    ? Math.round(((compareAtTotal - totalAmount) / compareAtTotal) * 100)
    : 0;

  const [showSizePicker, setShowSizePicker] = useState(false);
  const variants = (product as any).variants?.nodes || [];
  const hasMultipleVariants = variants.length > 1;

  return (
    <li
      key={id}
      className={
        layout === 'page'
          ? 'p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-border bg-card last:mb-0 transition-shadow'
          : 'p-2 rounded-2xl sm:my-5 border border-gray-200'
      }
    >
      <div className="relative flex gap-3 sm:gap-4">
        {/* Product Image */}
        {image && (
          <Link
            to={lineItemUrl}
            onClick={() => layout === 'aside' && close()}
            className="shrink-0 relative block"
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden">
              <Image
                alt={title}
                aspectRatio="1/1"
                data={image}
                height={80}
                loading="lazy"
                sizes="(min-width: 640px) 112px, 96px"
                width={80}
                className="w-full h-full object-cover"
              />
            </div>
            {layout === 'aside' && reviewSummary && reviewSummary.reviewCount > 0 && (
              <StarRating
                rating={reviewSummary.averageRating}
                count={reviewSummary.reviewCount}
                className="absolute bottom-1.5 left-1.5 z-10 shadow-sm"
              />
            )}
            {onToggleSelection && (
              <div 
                className="absolute top-1.5 left-1.5 z-20"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSelection(!isSelected);
                }}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer border shadow-sm ${isSelected ? 'bg-[#F14514] border-[#F14514] text-white' : 'bg-white border-gray-300'}`}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            )}
          </Link>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0 pr-14 sm:pr-16">
          <Link
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => layout === 'aside' && close()}
            className="no-underline block"
          >
            <p className="text-sm rounded-lg sm:text-lg leading-snug truncate">
              {product.title}
            </p>
          </Link>

          {layout === 'page' && reviewSummary && reviewSummary.reviewCount > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3.5 h-3.5 ${star <= Math.round(reviewSummary.averageRating) ? 'text-[#F14514]' : 'text-stone-200 dark:text-stone-700'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                  </svg>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                ({reviewSummary.reviewCount} {reviewSummary.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {/* Variant options */}
          {inlineOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {inlineOptions.map((option) => (
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
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg text-foreground font-montserrat">
              {line?.cost?.totalAmount ? (
                <Money withoutTrailingZeros data={line.cost.totalAmount} />
              ) : (
                '—'
              )}
            </span>
            {hasDiscount && (
              <>
                <s className="text-xs sm:text-sm text-stone-400 dark:text-stone-500 tracking-wide line-through">
                  <Money className="font-montserrat" withoutTrailingZeros data={{ amount: compareAtTotal.toString(), currencyCode: line.cost.totalAmount.currencyCode }} />
                </s>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase rounded-full dark:bg-stone-800 text-[#F14514] border dark:text-stone-300 dark:border-stone-700">
                  -{discountPercentage}%
                </span>
              </>
            )}
          </div>

          {/* Controls: Quantity */}
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
            <CartLineQuantity line={line} />
          </div>
        </div>

        {/* Remove */}
        <div className="shrink-0 self-start pt-1">
          <CartLineRemoveButton lineIds={[id]} disabled={!!line.isOptimistic} />
        </div>

        {/* Size Picker positioned absolute on the right bottom */}
        {mmOption ? (
          <div className={`absolute ${layout === 'page' ? 'bottom-1 right-1 sm:bottom-4 sm:right-4' : 'bottom-1 right-1'}`}>
            <div className="relative">
              {hasMultipleVariants ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSizePicker(!showSizePicker); }}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-medium border border-gray-300 text-black bg-white hover:bg-gray-50 transition-colors pointer-events-auto cursor-pointer"
                  >
                    Size: {mmOption.value}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  
                  {showSizePicker && (
                    <div className="absolute bottom-full right-0 mb-1 bg-white border border-border rounded-xl shadow-xl p-2 w-[160px] z-[60]">
                      <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Select Size</span>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSizePicker(false); }} className="text-muted-foreground hover:text-foreground">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map((v: any) => {
                          const vSize = v.selectedOptions.find((o: any) => /mm/i.test(`${o.name} ${o.value}`));
                          if (!vSize) return null;
                          const isSelected = v.id === line.merchandise.id;
                          return (
                            <CartLineUpdateButton key={v.id} lines={[{ id: line.id, merchandiseId: v.id }]}>
                              <button
                                onClick={() => setShowSizePicker(false)}
                                disabled={!v.availableForSale}
                                className={`px-2 py-1 text-[10px] font-medium rounded-full border transition-all ${
                                  isSelected 
                                    ? 'bg-black text-white border-black' 
                                    : v.availableForSale 
                                      ? 'bg-white text-black border-gray-200 hover:border-black' 
                                      : 'bg-gray-50 text-gray-400 border-gray-100 line-through opacity-60 cursor-not-allowed'
                                }`}
                              >
                                {vSize.value}
                              </button>
                            </CartLineUpdateButton>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="pointer-events-none rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-medium border border-gray-300 text-black bg-white">
                  Size: {mmOption.value}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Child line items */}
      {lineItemChildren ? (
        <div className="ml-19 sm:ml-24 mt-2 sm:mt-3 pl-2 sm:pl-3 border-l-2 border-border">
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
    <div className="flex items-center w-fit border border-gray-300 rounded-lg overflow-hidden">
      <CartLineUpdateButton lines={[{ id: lineId, quantity: prevQuantity }]}>
        <button
          aria-label="Decrease quantity"
          title={
            quantity <= 1 ? 'Minimum quantity is 1' : `Set quantity to ${prevQuantity}`
          }
          disabled={quantity <= 1 || !!isOptimistic}
          name="decrease-quantity"
          value={prevQuantity}
          className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-black hover:bg-gray-100 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <span aria-hidden="true" className="text-xl sm:text-2xl">
            -
          </span>
        </button>
      </CartLineUpdateButton>

      <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm text-black border-x border-gray-300 select-none">
        {quantity}
      </span>

      <CartLineUpdateButton lines={[{ id: lineId, quantity: nextQuantity }]}>
        <button
          aria-label="Increase quantity"
          title={`Set quantity to ${nextQuantity}`}
          name="increase-quantity"
          value={nextQuantity}
          disabled={!!isOptimistic}
          className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-black hover:bg-gray-100 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <span aria-hidden="true" className="text-lg sm:text-xl leading-none">
            +
          </span>
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
        className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-gray-100 hover:text-red-600 hover:bg-muted transition-all disabled:opacity-30 cursor-pointer border border-border"
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
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm px-4">
          <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Remove Item?</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
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
                    className="w-full px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
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
