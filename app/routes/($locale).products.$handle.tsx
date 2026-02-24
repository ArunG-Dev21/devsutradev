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
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">

        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb productTitle={title} />
        </div>

        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 lg:items-start">

          {/* ── LEFT: Image Gallery ── */}
          <div className="lg:sticky lg:top-10">

            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-2xl bg-white border border-stone-200 shadow-sm mb-4 relative group">
              {images[selectedImageIndex] && (
                <Image
                  data={images[selectedImageIndex]}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {images.map((img, idx) => (
                  <button
                    key={img.url}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer ${idx === selectedImageIndex
                      ? 'border-stone-900 shadow-sm opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-stone-300'
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
            <div className="mt-6 flex items-center gap-4 bg-white border border-stone-200 rounded-xl px-5 py-4 shadow-sm">
              <span className="text-2xl opacity-80">📜</span>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-stone-900 mb-1">
                  Lab Certified Authenticity
                </p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  This product comes with a certificate of authenticity verified by our gemological lab.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="lg:py-2 flex flex-col">

            {/* Category tag */}
            {product.vendor && (
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-[10px] tracking-widest uppercase text-stone-500 font-medium">
                  {product.vendor}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-stone-900 leading-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {title}
            </h1>

            {/* Rating placeholder */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-stone-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-stone-500 tracking-wider uppercase font-medium">(4.9 · 128 reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-8 text-xl text-stone-600">
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
              />
            </div>

            {/* Short description / hook */}
            <p className="text-base text-stone-600 leading-relaxed mb-8 italic border-l border-stone-300 pl-5">
              Handpicked and energised with Vedic mantras — crafted to bring harmony, protection, and spiritual clarity to your daily life.
            </p>

            {/* Product Form */}
            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
            />

            {/* Divider */}
            <div className="h-px bg-stone-200 my-8" />

            {/* Trust mini-badges */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: '✓', text: '100% Authentic', sub: 'Ethically sourced' },
                { icon: '✦', text: 'Lab Certified', sub: 'Certificate included' },
                { icon: '→', text: 'Free Shipping', sub: 'Above ₹999' },
                { icon: '↺', text: 'Easy Returns', sub: '7-day policy' },
              ].map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm hover:border-stone-300 transition-colors"
                >
                  <span className="text-lg text-stone-900 opacity-80">{badge.icon}</span>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-stone-900 mb-0.5">{badge.text}</p>
                    <p className="text-[10px] text-stone-500">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description accordion */}
            <div className="space-y-0 border-t border-stone-200">
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
                <details key={section.id} open={section.defaultOpen} className="group border-b border-stone-200">
                  <summary className="flex items-center justify-between cursor-pointer py-5 select-none list-none outline-none">
                    <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900">
                      {section.title}
                    </h3>
                    <svg
                      className="w-4 h-4 text-stone-400 transition-transform duration-300 group-open:rotate-180 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="pb-6 text-sm text-stone-600 leading-relaxed">
                    {section.html ? (
                      <div
                        className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-stone-900 prose-a:text-stone-900 underline-offset-4"
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
            <div className="mt-12">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 mb-6 border-b border-stone-200 pb-4">
                Customer Reviews
              </h3>
              <div className="space-y-5">
                {[
                  { name: 'Priya M.', date: 'Jan 2025', rating: 5, text: 'Absolutely beautiful piece. The energy is palpable the moment you hold it. Packaging was pristine and the certificate of authenticity gave me great confidence.' },
                  { name: 'Rajan K.', date: 'Dec 2024', rating: 5, text: 'I have been searching for a genuine rudraksha for years. Devasutra delivered beyond my expectations — the energisation ritual makes a real difference.' },
                  { name: 'Ananya S.', date: 'Nov 2024', rating: 4, text: 'Very satisfied with the quality. The lab certification is a nice touch. Shipping was fast and the product was exactly as described.' },
                ].map((review) => (
                  <div key={review.name} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-stone-900 uppercase">{review.name}</p>
                        <p className="text-[10px] tracking-wider text-stone-500 mt-0.5 uppercase">{review.date}</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < review.rating ? 'text-stone-900' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: Product Specs ── */}
            <div className="mt-12">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 mb-6 border-b border-stone-200 pb-4">
                Product Specifications
              </h3>
              <div className="rounded-2xl overflow-hidden border border-stone-200">
                {[
                  { label: 'Origin', value: 'Nepal / Indonesia' },
                  { label: 'Mukhi (Faces)', value: '5 Mukhi' },
                  { label: 'Size', value: '18–22mm' },
                  { label: 'Weight', value: 'Approx. 4–6g' },
                  { label: 'String Material', value: 'Red silk thread' },
                  { label: 'Energisation', value: 'Prana Pratishtha performed' },
                  { label: 'Certification', value: 'GIA / IGI Lab Verified' },
                ].map((spec, i) => (
                  <div key={spec.label} className={`flex items-center justify-between px-5 py-4 text-xs ${i % 2 === 0 ? 'bg-stone-50' : 'bg-white'}`}>
                    <span className="text-stone-500 font-medium tracking-wide uppercase">{spec.label}</span>
                    <span className="text-stone-900 font-medium text-right capitalize">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: How to Wear ── */}
            <div className="mt-12">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 mb-6 border-b border-stone-200 pb-4">
                How to Wear & Care
              </h3>
              <div className="space-y-4">
                {[
                  { step: '01', title: 'Cleanse before wearing', desc: 'Wash the rudraksha with clean water on a Monday morning before first use.' },
                  { step: '02', title: 'Wear on the right wrist or neck', desc: 'For maximum benefit, wear touching the skin. Avoid synthetic clothing contact.' },
                  { step: '03', title: 'Monthly oil treatment', desc: 'Apply a drop of sandalwood or sesame oil monthly to keep the surface nourished.' },
                  { step: '04', title: 'Remove during sleep & bathing', desc: 'Take off during bathing and sleep to extend the life of the thread and bead.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5 items-start bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-xl font-light text-stone-400 leading-none flex-shrink-0" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {item.step}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 mb-2">{item.title}</p>
                      <p className="text-xs text-stone-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: FAQs ── */}
            <div className="mt-12 mb-10">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 mb-6 border-b border-stone-200 pb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-0 border-t border-stone-200">
                {[
                  { q: 'Is this product genuine?', a: 'Yes — every product at Devasutra is sourced directly and verified by our in-house gemological team. A lab certificate is included with every order.' },
                  { q: 'How long does shipping take?', a: 'We ship Pan-India within 1–2 business days. Delivery typically takes 3–7 business days depending on your location.' },
                  { q: 'Can I return this product?', a: 'We accept returns within 7 days of delivery in original, unworn condition. Please contact our support team to initiate a return.' },
                  { q: 'Will I receive a certificate?', a: 'Yes. Every order includes a printed certificate of authenticity from our certified gemological lab.' },
                ].map((faq) => (
                  <details key={faq.q} className="group border-b border-stone-200">
                    <summary className="flex items-center justify-between cursor-pointer py-5 select-none list-none outline-none">
                      <span className="text-[11px] font-semibold tracking-wide uppercase text-stone-900 pr-4">{faq.q}</span>
                      <svg className="w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="text-sm text-stone-600 leading-relaxed pb-6">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── "You May Also Like" placeholder ── */}
        <section className="mt-20 md:mt-32 border-t border-stone-200 pt-16">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-3">Handpicked For You</p>
            <h2 className="text-3xl md:text-4xl font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              You May Also Like
            </h2>
          </div>

          {/* Placeholder cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer flex flex-col">
                <div className="aspect-square bg-stone-50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-stone-200 transition-transform duration-700 group-hover:scale-105">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-3.5 bg-stone-100 rounded-md w-3/4" />
                  <div className="h-3.5 bg-stone-100 rounded-md w-1/3" />
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