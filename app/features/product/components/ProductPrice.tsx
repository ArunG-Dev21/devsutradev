import { Money } from '@shopify/hydrogen';
import type { MoneyV2 } from '@shopify/hydrogen/storefront-api-types';

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  return (
    <div className="product-price">
      {compareAtPrice ? (
        <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
          <span className="text-2xl lg:text-3xl text-stone-900 dark:text-stone-100 tracking-wide">
            {price ? <Money withoutTrailingZeros data={price} /> : null}
          </span>
          <s className="text-lg sm:text-2xl text-stone-400 dark:text-stone-500 tracking-wide">
            <Money withoutTrailingZeros data={compareAtPrice} />
          </s>
          {price && (
            <span className="px-2 py-1 text-[10px] tracking-widest uppercase rounded-full dark:bg-stone-800 text-[#F14514] border rounded-2xl dark:text-stone-300 dark:border-stone-700">
              -
              {Math.round(
                ((parseFloat(compareAtPrice.amount) -
                  parseFloat(price.amount)) /
                  parseFloat(compareAtPrice.amount)) *
                100,
              )}
              %
            </span>
          )}
        </div>
      ) : price ? (
        <span className="text-2xl lg:text-3xl font-light text-stone-900 dark:text-stone-100 tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          <Money withoutTrailingZeros data={price} />
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
