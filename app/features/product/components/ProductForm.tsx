import { Link, useNavigate } from 'react-router';
import { type MappedProductOptions } from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import { AddToCartButton } from '~/features/cart/components/AddToCartButton';
import { useAside } from '~/shared/components/Aside';
import type { ProductFragment } from 'storefrontapi.generated';

export function ProductForm({
  productOptions,
  selectedVariant,
  stockQty,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  stockQty?: number | null;
}) {
  const navigate = useNavigate();
  const { open } = useAside();

  const isLow = typeof stockQty === 'number' && stockQty <= 5;
  const firstRenderedIdx = productOptions.findIndex((o) => o.optionValues.length !== 1);

  return (
    <div className="space-y-6">
      {/* Variant Options */}
      {productOptions.map((option, idx) => {
        if (option.optionValues.length === 1) return null;

        return (
          <div key={option.name}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs md:text-base tracking-[0.15em]">
                {option.name.toLowerCase() === 'size' ? 'Choose your size' : option.name}
              </p>
              {idx === firstRenderedIdx && stockQty != null && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity ${isLow ? 'bg-red-400' : 'bg-lime-400'}`} />
                    <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isLow ? 'bg-red-500' : 'bg-lime-500'}`} />
                  </span>
                  <span className={`text-sm font-semibold ${isLow ? 'text-red-500' : 'text-lime-500'}`}>
                    {isLow ? `Only ${stockQty} left` : `${stockQty} in stock`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                const isColor = !!swatch?.color || !!swatch?.image;
                const pillClass = isColor
                  ? `p-0.5 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${selected ? 'border-2 border-gray-900' : 'border border-transparent hover:border-gray-300'
                  }`
                  : `min-w-[4rem] px-5 py-3 text-sm font-semibold uppercase rounded-full transition-all duration-200 cursor-pointer text-center ${selected
                    ? 'border-2 border-gray-900 bg-black text-white'
                    : available
                      ? 'border border-gray-300 hover:border-gray-500 text-gray-700 bg-white'
                      : 'border border-gray-200 text-gray-300 bg-gray-50 line-through cursor-not-allowed'
                  }`;

                if (isDifferentProduct) {
                  return (
                    <Link
                      className={pillClass}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      className={pillClass}
                      key={option.name + name}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="flex flex-col xl:flex-row gap-3 pt-2">
        <div className="flex-1 w-full flex [&>form]:w-full">
          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={() => open('cart')}
            lines={
              selectedVariant
                ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant,
                  },
                ]
                : []
            }
          >
            {selectedVariant?.availableForSale ? (
              <span className="flex items-center justify-center gap-2">
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
                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                Add to Cart
              </span>
            ) : (
              'Sold out'
            )}
          </AddToCartButton>
        </div>

        {selectedVariant?.availableForSale && (() => {
          const numericId = selectedVariant.id.split('/').pop();
          return (
            <div className="flex-1 w-full flex">
              <a
                href={`/cart/${numericId}:1`}
                className="w-full py-3.5 text-[11px] tracking-[0.2em] uppercase font-medium rounded-full border border-stone-300 text-stone-700 dark:text-white dark:border-white hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 cursor-pointer text-center flex items-center justify-center gap-2 no-underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                </svg>
                Buy Now
              </a>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="w-[42px] h-[42px] rounded-full border border-gray-200 flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && (
        <img src={image} alt={name} width={42} height={42} sizes="42px" className="w-full h-full object-cover" />
      )}
    </div>
  );
}
