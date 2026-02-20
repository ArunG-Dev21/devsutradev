import { useState } from 'react';
import { Image, Money } from '@shopify/hydrogen';
import { Link } from 'react-router';
import { QuickViewModal } from '~/components/QuickViewModal';

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  availableForSale?: boolean;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number;
    height?: number;
  } | null;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  compareAtPriceRange?: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  variants?: {
    nodes: Array<{ id: string; availableForSale: boolean }>;
  };
};

interface FeaturedCollectionProps {
  collection: {
    title: string;
    handle: string;
    products: {
      nodes: ProductNode[];
    };
  };
}

/**
 * Featured Collection grid — right half of the hero section.
 * Shows products with sort dropdown, add-to-cart, and quick-view modal.
 */
export function FeaturedCollectionComponent({
  collection,
}: FeaturedCollectionProps) {
  const [sortKey, setSortKey] = useState('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductNode | null>(
    null,
  );

  const products = [...collection.products.nodes];

  // Client-side sort
  const sortedProducts = (() => {
    switch (sortKey) {
      case 'price-asc':
        return products.sort(
          (a, b) =>
            parseFloat(a.priceRange.minVariantPrice.amount) -
            parseFloat(b.priceRange.minVariantPrice.amount),
        );
      case 'price-desc':
        return products.sort(
          (a, b) =>
            parseFloat(b.priceRange.minVariantPrice.amount) -
            parseFloat(a.priceRange.minVariantPrice.amount),
        );
      case 'az':
        return products.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return products;
    }
  })();

  return (
    <div className="bg-[#FAFAFA] min-h-[50vh] md:min-h-[90vh] flex flex-col">
      <div className="px-4 md:px-8 lg:px-12 py-6 md:py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <p
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-1"
            style={{ color: '#C5A355' }}
          >
            Sacred Collection
          </p>
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-light"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {collection.title}
          </h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-neutral-500">
            {sortedProducts.length} products
          </p>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-1.5 pr-8 text-xs uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C5A355]/50"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="az">A – Z</option>
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none">
              ▼
            </span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 flex-1 auto-rows-min overflow-y-auto">
          {sortedProducts.map((product) => (
            <div key={product.id} className="group relative">
              {/* Quick-view overlay button */}
              <button
                onClick={() => setQuickViewProduct(product)}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:bg-[#C5A355] hover:text-white"
                aria-label={`Quick view ${product.title}`}
              >
                +
              </button>

              <Link
                to={`/products/${product.handle}`}
                className="block no-underline"
              >
                {/* Image */}
                <div className="overflow-hidden rounded-lg mb-2 bg-white aspect-square">
                  {product.featuredImage && (
                    <Image
                      data={product.featuredImage}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(min-width: 1024px) 25vw, 50vw"
                    />
                  )}
                </div>

                {/* Info */}
                <h3 className="text-xs md:text-sm font-medium text-neutral-800 truncate">
                  {product.title}
                </h3>
                <div className="text-xs md:text-sm font-semibold mt-0.5" style={{ color: '#C5A355' }}>
                  <Money data={product.priceRange.minVariantPrice} />
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="mt-4 text-center">
          <Link
            to={`/collections/${collection.handle}`}
            className="inline-block text-xs tracking-[0.15em] uppercase py-2 px-6 border border-neutral-300 rounded-full hover:border-[#C5A355] hover:text-[#C5A355] transition no-underline"
          >
            View All →
          </Link>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}