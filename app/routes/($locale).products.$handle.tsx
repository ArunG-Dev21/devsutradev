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

// ─── Main Product Component ───────────────────────────────────────────────────

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

  const { title, descriptionHtml } = product;

  // Collect all images
  const images: Array<{ url: string; altText?: string | null; width?: number; height?: number; id?: string }> = [];
  if (selectedVariant?.image) {
    images.push(selectedVariant.image);
  }
  if (product.images?.nodes) {
    product.images.nodes.forEach((img: { url: string; altText?: string | null; width?: number; height?: number; id?: string }) => {
      if (!images.find((i) => i.url === img.url)) {
        images.push(img);
      }
    });
  }

  return (
    <div className="min-h-screen bg-amber-50/30">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb productTitle={title} />
        </div>

        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 lg:items-start">

          {/* ── LEFT: Image Gallery ── */}
          <div className="lg:sticky lg:top-6">

            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-2xl bg-stone-100 border border-amber-100 shadow-sm mb-3 relative group">
              {images[selectedImageIndex] && (
                <Image
                  data={images[selectedImageIndex]}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              )}
              {/* Corner ornament */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-400/50 rounded-tl pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-400/50 rounded-br pointer-events-none" />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.url}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                      idx === selectedImageIndex
                        ? 'border-amber-500 shadow-md opacity-100'
                        : 'border-stone-200 opacity-50 hover:opacity-80 hover:border-amber-300'
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

            {/* Certification badge below image */}
            <div className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-2xl">📜</span>
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-amber-800">
                  Lab Certified Authenticity
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  This product comes with a certificate of authenticity verified by our gemological lab.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="lg:py-2">

            {/* Category tag */}
            {product.vendor && (
              <div className="inline-flex items-center gap-1.5 mb-3">
                <span className="text-amber-500 text-xs">✦</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-amber-700 font-medium">
                  {product.vendor}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-800 leading-tight mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {title}
            </h1>

            {/* Decorative rule */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-amber-400/60 to-transparent" />
              <span className="text-amber-400 text-xs">✦</span>
              <div className="h-px flex-1 bg-gradient-to-l from-amber-400/60 to-transparent" />
            </div>

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-stone-500 tracking-wide">(4.9 · 128 reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
              />
            </div>

            {/* Short description / hook */}
            <p className="text-sm text-stone-600 leading-relaxed mb-6 italic border-l-2 border-amber-400 pl-4">
              Handpicked and energised with Vedic mantras — crafted to bring harmony, protection, and spiritual clarity to your daily life.
            </p>

            {/* Product Form */}
            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
            />

            {/* Divider */}
            <div className="border-t border-amber-100 my-6" />

            {/* Trust mini-badges */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: '✅', text: '100% Authentic', sub: 'Ethically sourced' },
                { icon: '📜', text: 'Lab Certified', sub: 'Certificate included' },
                { icon: '🚚', text: 'Free Shipping', sub: 'Above ₹999' },
                { icon: '🔄', text: 'Easy Returns', sub: '7-day policy' },
              ].map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-start gap-2.5 bg-white border border-amber-100 rounded-xl px-3 py-2.5 shadow-sm"
                >
                  <span className="text-base leading-tight mt-0.5">{badge.icon}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-stone-700 tracking-wide">{badge.text}</p>
                    <p className="text-[10px] text-stone-400">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description accordion */}
            <div className="space-y-0 border-t border-amber-100">
              {[
                {
                  id: 'description',
                  title: 'Description',
                  content: null,
                  html: descriptionHtml,
                  defaultOpen: true,
                },
                {
                  id: 'ritual',
                  title: 'Energisation & Ritual',
                  content: 'Each product at Devasutra is energised through traditional Vedic rituals — chanting of specific mantras, puja ceremonies, and abhishekam — to maximise its spiritual efficacy before being packaged and shipped to you.',
                  html: null,
                  defaultOpen: false,
                },
                {
                  id: 'shipping',
                  title: 'Shipping & Returns',
                  content: 'We ship Pan-India. Orders above ₹999 qualify for free shipping. Delivery in 3–7 business days. Returns accepted within 7 days of receipt in original condition.',
                  html: null,
                  defaultOpen: false,
                },
              ].map((section) => (
                <details key={section.id} open={section.defaultOpen} className="group border-b border-amber-100">
                  <summary className="flex items-center justify-between cursor-pointer py-4 select-none list-none">
                    <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-stone-700">
                      {section.title}
                    </h3>
                    <svg
                      className="w-4 h-4 text-amber-500 transition-transform duration-300 group-open:rotate-180 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="pb-4 text-sm text-stone-600 leading-relaxed">
                    {section.html ? (
                      <div
                        className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-stone-700 prose-a:text-amber-700"
                        dangerouslySetInnerHTML={{ __html: section.html }}
                      />
                    ) : (
                      <p>{section.content}</p>
                    )}
                  </div>
                </details>
              ))}
            </div>

            {/* ── DEMO: Reviews ── */}
            <div className="mt-8 border-t border-amber-100 pt-6">
              <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-stone-700 mb-5">
                Customer Reviews
              </h3>
              <div className="space-y-4">
                {[
                  { name: 'Priya M.', date: 'Jan 2025', rating: 5, text: 'Absolutely beautiful piece. The energy is palpable the moment you hold it. Packaging was pristine and the certificate of authenticity gave me great confidence.' },
                  { name: 'Rajan K.', date: 'Dec 2024', rating: 5, text: 'I have been searching for a genuine rudraksha for years. Devasutra delivered beyond my expectations — the energisation ritual makes a real difference.' },
                  { name: 'Ananya S.', date: 'Nov 2024', rating: 4, text: 'Very satisfied with the quality. The lab certification is a nice touch. Shipping was fast and the product was exactly as described.' },
                ].map((review) => (
                  <div key={review.name} className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-stone-700">{review.name}</p>
                        <p className="text-[10px] text-stone-400">{review.date}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: Product Specs ── */}
            <div className="mt-8 border-t border-amber-100 pt-6">
              <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-stone-700 mb-5">
                Product Specifications
              </h3>
              <div className="rounded-2xl overflow-hidden border border-amber-100">
                {[
                  { label: 'Origin', value: 'Nepal / Indonesia' },
                  { label: 'Mukhi (Faces)', value: '5 Mukhi' },
                  { label: 'Size', value: '18–22mm' },
                  { label: 'Weight', value: 'Approx. 4–6g' },
                  { label: 'String Material', value: 'Red silk thread' },
                  { label: 'Energisation', value: 'Prana Pratishtha performed' },
                  { label: 'Certification', value: 'GIA / IGI Lab Verified' },
                ].map((spec, i) => (
                  <div key={spec.label} className={`flex items-center justify-between px-4 py-3 text-xs ${i % 2 === 0 ? 'bg-amber-50/60' : 'bg-white'}`}>
                    <span className="text-stone-400 font-medium tracking-wide">{spec.label}</span>
                    <span className="text-stone-700 font-semibold text-right">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: How to Wear ── */}
            <div className="mt-8 border-t border-amber-100 pt-6">
              <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-stone-700 mb-5">
                How to Wear & Care
              </h3>
              <div className="space-y-3">
                {[
                  { step: '01', title: 'Cleanse before wearing', desc: 'Wash the rudraksha with clean water on a Monday morning before first use.' },
                  { step: '02', title: 'Wear on the right wrist or neck', desc: 'For maximum benefit, wear touching the skin. Avoid synthetic clothing contact.' },
                  { step: '03', title: 'Monthly oil treatment', desc: 'Apply a drop of sandalwood or sesame oil monthly to keep the surface nourished.' },
                  { step: '04', title: 'Remove during sleep & bathing', desc: 'Take off during bathing and sleep to extend the life of the thread and bead.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 items-start bg-white border border-amber-100 rounded-2xl px-4 py-3.5 shadow-sm">
                    <span className="text-lg font-bold text-amber-200 leading-none flex-shrink-0" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {item.step}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-stone-700 mb-1">{item.title}</p>
                      <p className="text-[11px] text-stone-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: FAQs ── */}
            <div className="mt-8 border-t border-amber-100 pt-6 mb-6">
              <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-stone-700 mb-5">
                Frequently Asked Questions
              </h3>
              <div className="space-y-0 border-t border-amber-100">
                {[
                  { q: 'Is this product genuine?', a: 'Yes — every product at Devasutra is sourced directly and verified by our in-house gemological team. A lab certificate is included with every order.' },
                  { q: 'How long does shipping take?', a: 'We ship Pan-India within 1–2 business days. Delivery typically takes 3–7 business days depending on your location.' },
                  { q: 'Can I return this product?', a: 'We accept returns within 7 days of delivery in original, unworn condition. Please contact our support team to initiate a return.' },
                  { q: 'Will I receive a certificate?', a: 'Yes. Every order includes a printed certificate of authenticity from our certified gemological lab.' },
                ].map((faq) => (
                  <details key={faq.q} className="group border-b border-amber-100">
                    <summary className="flex items-center justify-between cursor-pointer py-4 select-none list-none">
                      <span className="text-xs font-semibold text-stone-700 pr-4">{faq.q}</span>
                      <svg className="w-4 h-4 text-amber-500 flex-shrink-0 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="text-xs text-stone-500 leading-relaxed pb-4">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── "You May Also Like" placeholder ── */}
        <section className="mt-16 md:mt-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-amber-200" />
            <div className="text-center">
              <p className="text-[9px] tracking-[0.35em] uppercase text-amber-600 mb-1">Handpicked For You</p>
              <h2 className="text-2xl md:text-3xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                You May Also Like
              </h2>
            </div>
            <div className="h-px flex-1 bg-amber-200" />
          </div>

          {/* Placeholder cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer">
                <div className="aspect-square bg-amber-50/60 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-stone-100/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl opacity-20">✦</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="h-3 bg-stone-100 rounded-full w-3/4 mb-2" />
                  <div className="h-3 bg-amber-100 rounded-full w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

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

// ─── GraphQL Fragments ────────────────────────────────────────────────────────

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