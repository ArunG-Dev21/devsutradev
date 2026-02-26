import { Link } from 'react-router';
import { Image, Money } from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
} from 'storefrontapi.generated';
import { useVariantUrl } from '~/lib/variants';

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
  const tags =
    'tags' in product && Array.isArray((product as any).tags)
      ? ((product as any).tags as string[]).filter(Boolean)
      : [];
  const primaryTag = tags[0];
  return (
    <Link
      className="product-item group relative flex flex-col h-full animate-fade-up no-underline"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="relative overflow-hidden rounded-xl mb-4 bg-bg-light border border-primary-border flex-1 aspect-[4/5] shadow-silver transform transition-all duration-500 group-hover:shadow-glow group-hover:-translate-y-1">
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
      </div>

      <div className="flex flex-col items-center text-center mt-auto px-2 pb-2">
        {primaryTag ? (
          <span className="text-[10px] tracking-[0.2em] uppercase text-text-muted mb-2">
            {primaryTag}
          </span>
        ) : null}
        <h3 className="text-[13px] md:text-sm font-medium text-text-main mb-1.5 transition-colors duration-300 group-hover:text-accent line-clamp-2 leading-relaxed">
          {product.title}
        </h3>
        <div className="text-[13px] tracking-wide text-text-muted font-medium">
          <Money data={product.priceRange.minVariantPrice} />
        </div>
      </div>
    </Link>
  );
}
