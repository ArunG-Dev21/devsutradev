import { redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  Image,
} from '@shopify/hydrogen';
import { ProductPrice } from '~/components/ProductPrice';
import { ProductForm } from '~/components/ProductForm';
import { Breadcrumb } from '~/components/Breadcrumb';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { useState } from 'react';

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: `${data?.product.title ?? ''} | Devasutra` },
    {
      name: 'description',
      content: data?.product.description?.substring(0, 155) ?? '',
    },
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return { ...deferredData, ...criticalData };
}

async function loadCriticalData({ context, params, request }: Route.LoaderArgs) {
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{ product }] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: { handle, selectedOptions: getSelectedProductOptions(request) },
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, { status: 404 });
  }

  redirectIfHandleIsLocalized(request, { handle, data: product });

  return { product };
}

function loadDeferredData({ context, params }: Route.LoaderArgs) {
  return {};
}

export default function Product() {
  const { product } = useLoaderData<typeof loader>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const { title, descriptionHtml, description } = product;

  // Collect all images from the selected variant + other product images
  const images: Array<{ url: string; altText?: string | null; width?: number; height?: number; id?: string }> = [];
  if (selectedVariant?.image) {
    images.push(selectedVariant.image);
  }
  // If we have media, add unique images
  if (product.images?.nodes) {
    product.images.nodes.forEach((img: { url: string; altText?: string | null; width?: number; height?: number; id?: string }) => {
      if (!images.find((i) => i.url === img.url)) {
        images.push(img);
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Breadcrumb */}
      <Breadcrumb productTitle={title} />

      {/* Product Layout: 2-column on desktop */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* LEFT — Image Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Main Image */}
          <div className="aspect-square overflow-hidden rounded-xl bg-neutral-50 mb-3">
            {images[selectedImageIndex] && (
              <Image
                data={images[selectedImageIndex]}
                className="w-full h-full object-cover transition-all duration-500"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            )}
          </div>

          {/* Thumbnail Row */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.url}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer ${idx === selectedImageIndex
                      ? 'border-[#C5A355] opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <Image
                    data={img}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Product Info (sticky on desktop) */}
        <div className="lg:py-4">
          {/* Title */}
          <h1
            className="text-2xl md:text-4xl font-semibold mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {title}
          </h1>

          {/* Vendor */}
          {product.vendor && (
            <p className="text-xs tracking-[0.15em] uppercase text-neutral-400 mb-4">
              by {product.vendor}
            </p>
          )}

          {/* Price */}
          <div className="mb-6">
            <ProductPrice
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
            />
          </div>

          {/* Product Options + Add to Cart */}
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />

          {/* Divider */}
          <div className="border-t border-neutral-100 my-6" />

          {/* Trust mini-badges */}
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { icon: '✅', text: '100% Authentic' },
              { icon: '📜', text: 'Lab Certified' },
              { icon: '🚚', text: 'Free Shipping' },
              { icon: '🔄', text: 'Easy Returns' },
            ].map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-1.5 text-xs text-neutral-500"
              >
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="border-t border-neutral-100 pt-6">
            <details open className="group">
              <summary className="flex items-center justify-between cursor-pointer mb-4">
                <h3 className="text-sm font-semibold tracking-wide uppercase">
                  Description
                </h3>
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div
                className="prose prose-sm max-w-none text-neutral-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </details>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
