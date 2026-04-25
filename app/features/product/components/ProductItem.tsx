import { Link } from 'react-router';
import { Image, Money } from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
} from 'storefrontapi.generated';
import { useVariantUrl } from '~/lib/variants';
import { WishlistHeart } from '~/shared/components/WishlistHeart';

export function ProductItem({
  product,
  loading,
}: {
  product:
  | CollectionItemFragment
  | ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      className="product-item group relative flex flex-col h-full animate-fade-up no-underline"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="relative overflow-hidden rounded-xl mb-4 bg-bg-light border border-primary-border flex-1 aspect-[4/5] shadow-silver transform transition-all duration-500 group-hover:-translate-y-1">
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="4/5"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-white/5 transition-colors duration-500" />
        <div className="absolute bottom-2 left-2 z-10">
          <WishlistHeart
            productId={product.id}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm hover:bg-white"
            size={18}
          />
        </div>
      </div>

      <div className="flex flex-col items-center text-center mt-auto px-2 pb-3">
        <h3 className="text-sm md:text-[15px] font-medium text-text-main mb-1 transition-colors duration-300 group-hover:text-accent line-clamp-2 leading-snug">
          {product.title}
        </h3>
        <div className="text-base md:text-lg font-semibold tracking-wide text-text-main">
          <Money className="font-montserrat" withoutTrailingZeros data={product.priceRange.minVariantPrice} />
        </div>
      </div>
    </Link>
  );
}
