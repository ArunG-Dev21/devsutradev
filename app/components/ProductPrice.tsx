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
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold" style={{ color: '#C5A355' }}>
            {price ? <Money data={price} /> : null}
          </span>
          <s className="text-base text-neutral-400">
            <Money data={compareAtPrice} />
          </s>
          {price && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
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
        <span className="text-2xl font-bold" style={{ color: '#C5A355' }}>
          <Money data={price} />
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
