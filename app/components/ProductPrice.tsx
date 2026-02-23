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
        <div className="flex items-center gap-4">
          <span className="text-2xl lg:text-3xl font-light text-stone-900 tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {price ? <Money data={price} /> : null}
          </span>
          <s className="text-lg text-stone-400 tracking-wide">
            <Money data={compareAtPrice} />
          </s>
          {price && (
            <span className="px-3 py-1 text-[10px] font-semibold tracking-widest uppercase rounded-md bg-stone-100 text-stone-600 border border-stone-200">
              {Math.round(
                ((parseFloat(compareAtPrice.amount) -
                  parseFloat(price.amount)) /
                  parseFloat(compareAtPrice.amount)) *
                100,
              )}
              % OFF
            </span>
          )}
        </div>
      ) : price ? (
        <span className="text-2xl lg:text-3xl font-light text-stone-900 tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          <Money data={price} />
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
