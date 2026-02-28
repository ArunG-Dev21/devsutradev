import { redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).products.$handle';
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
import { ProductShare } from '~/components/ProductShare';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { useMemo, useState } from 'react';

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
  const displayTags = useMemo(() => {
    const tags = ((product as any).tags as string[] | undefined) ?? [];
    return tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8);
  }, [product]);



  // Collect all images
  type ProductImageData = {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
    id?: string;
  };

  const normalizeImage = (img: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
    id?: string | null;
  }): ProductImageData => ({
    url: img.url,
    altText: img.altText ?? null,
    width: img.width ?? null,
    height: img.height ?? null,
    id: img.id ?? undefined,
  });

  const images: ProductImageData[] = [];
  if (selectedVariant?.image) {
    images.push(normalizeImage(selectedVariant.image));
  }
  if (product.images?.nodes) {
    product.images.nodes.forEach((img) => {
      const normalized = normalizeImage(img);
      if (!images.find((i) => i.url === normalized.url)) {
        images.push(normalized);
      }
    });
  }

  const [expandedImage, setExpandedImage] = useState<any>(null);

  // Parse Testimonials Metaobject
  const testimonials = (product.testimonials?.references?.nodes || []).map((node: any) => {
    const fields = node.fields || [];
    const getField = (key: string) => fields.find((f: any) => f.key === key)?.value;
    const getCustomerImage = () => {
      const imgRef = fields.find((f: any) => f.key === 'customer_image')?.reference;
      return imgRef?.image || null;
    };
    const getProductImage = () => {
      const imgRef = fields.find((f: any) => f.key === 'customer_product_image')?.reference;
      return imgRef?.image || null;
    };

    return {
      name: getField('name') || 'Verified Buyer',
      rating: parseInt(getField('rating') || '5', 10),
      review: getField('review') || '',
      customer_image: getCustomerImage(),
      customer_product_image: getProductImage()
    };
  });

  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((acc: number, curr: any) => acc + curr.rating, 0) / testimonials.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen text-stone-900 dark:bg-background dark:text-foreground">

      {/* Lightbox Modal for Customer Uploaded Product Images */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md transition-opacity duration-300 relative">
          <button
            type="button"
            aria-label="Close image"
            className="absolute inset-0 border-0 p-0 bg-transparent"
            onClick={() => setExpandedImage(null)}
          />
          <div className="relative z-10 max-w-5xl w-full max-h-[95vh] flex flex-col items-center justify-center gap-6">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 sm:-right-8 sm:-top-8 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              data={expandedImage.customer_product_image}
              className="w-auto h-auto max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/10"
              sizes="100vw"
            />

            {/* Reviewer Details in Modal */}
            <div className="bg-stone-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 w-full max-w-md shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedImage.customer_image ? (
                    <Image data={expandedImage.customer_image} className="w-10 h-10 rounded-full object-cover border border-white/20" width={40} height={40} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center">
                      <span className="text-stone-300 text-lg font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{expandedImage.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold tracking-widest text-white uppercase">{expandedImage.name}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3.5 h-3.5 ${i < expandedImage.rating ? 'text-amber-400 drop-shadow-sm' : 'text-stone-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Verified</span>
                </div>
              </div>
              <p className="text-stone-300 text-sm italic font-medium">
                &ldquo;{expandedImage.review}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-24">


        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 lg:items-start">

          {/* ── LEFT: Image Gallery ── */}
          <div className="lg:sticky lg:top-10">

            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-2xl bg-white dark:bg-card border border-stone-200 dark:border-border shadow-sm mb-4 relative group">
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
            <div className="mt-6 flex items-center gap-4 bg-white dark:bg-card border border-stone-200 dark:border-border rounded-xl px-5 py-4 shadow-sm">
              <span className="text-2xl opacity-80">📜</span>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-stone-900 dark:text-foreground mb-1">
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

            {/* Vendor + Stock */}
            <div className="flex items-center flex-wrap gap-3 mb-4">
              {product.vendor ? (
                <span className="text-[10px] tracking-widest uppercase text-stone-500 font-medium">
                  {product.vendor}
                </span>
              ) : null}

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${selectedVariant?.availableForSale
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
              >
                {selectedVariant?.availableForSale ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Tags */}
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {displayTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-white dark:bg-card border border-stone-200 dark:border-border text-[10px] tracking-widest uppercase font-semibold text-stone-600 dark:text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-stone-900 dark:text-foreground leading-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {title}
            </h1>

            {/* Live Rating */}
            {testimonials.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(Number(avgRating)) ? 'text-stone-900 dark:text-foreground' : 'text-stone-200 dark:text-border'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                    </svg>
                  ))}
                </div>
                <a href="#reviews" className="text-xs text-stone-500 dark:text-muted-foreground tracking-wider uppercase font-medium hover:text-stone-900 dark:hover:text-foreground transition-colors">
                  ({avgRating} · {testimonials.length} review{testimonials.length !== 1 ? 's' : ''})
                </a>
              </div>
            )}

            {/* Price */}
            <div className="mb-8 text-xl text-stone-600 dark:text-muted-foreground">
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
              />
            </div>

            {/* Short description / hook */}
            <p className="text-base text-stone-600 dark:text-muted-foreground leading-relaxed mb-8 italic border-l border-stone-300 dark:border-border pl-5">
              Handpicked and energised with Vedic mantras — crafted to bring harmony, protection, and spiritual clarity to your daily life.
            </p>



            {/* Product Form */}
            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
            />

            {/* Stock count — plain text below size buttons */}
            {(() => {
              const variantNodes = (product as any).variants?.nodes as any[] | undefined;
              const matchedVariant = variantNodes?.find((v: any) => v.id === selectedVariant?.id);
              const qty = matchedVariant?.quantityAvailable;
              if (qty == null) return null;
              const isLow = qty <= 5;
              return (
                <p className={`text-lg font-semibold mt-4 ${isLow ? 'text-rose-600' : 'text-stone-700 dark:text-muted-foreground'
                  }`}>
                  {isLow && '⚠ '}Only {qty} left in stock{isLow ? ' — order soon!' : ''}
                </p>
              );
            })()}

            <ProductShare title={title} />


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
                  className="flex items-center gap-3 bg-white dark:bg-card border border-stone-200 dark:border-border rounded-xl px-4 py-3 shadow-sm hover:border-stone-300 dark:hover:border-ring transition-colors"
                >
                  <span className="text-lg text-stone-900 dark:text-foreground opacity-80">{badge.icon}</span>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-stone-900 dark:text-foreground mb-0.5">{badge.text}</p>
                    <p className="text-[10px] text-stone-500">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description accordion */}
            <div className="space-y-0 border-t border-stone-200 dark:border-border">
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
                <details key={section.id} open={section.defaultOpen} className="group border-b border-stone-200 dark:border-border">
                  <summary className="flex items-center justify-between cursor-pointer py-5 select-none list-none outline-none">
                    <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 dark:text-foreground">
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
                  <div className="pb-6 text-sm text-stone-600 dark:text-muted-foreground leading-relaxed">
                    {section.html ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-stone-900 dark:prose-headings:text-foreground prose-a:text-stone-900 dark:prose-a:text-foreground underline-offset-4"
                        dangerouslySetInnerHTML={{ __html: section.html }}
                      />
                    ) : (
                      <p>{section.content}</p>
                    )}
                  </div>
                </details>
              ))}
            </div>

            {/* ── LIVE: Reviews ── */}
            <div id="reviews" className="mt-12 scroll-mt-24">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 dark:text-foreground mb-6 border-b border-stone-200 dark:border-border pb-4">
                Customer Reviews
              </h3>

              {testimonials.length > 0 ? (
                <div className="space-y-6">
                  {testimonials.map((review: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-card border border-stone-200 dark:border-border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">

                      {/* Top Header Row */}
                      <div className="flex items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar Element */}
                          {review.customer_image ? (
                            <Image
                              data={review.customer_image}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-stone-100 shadow-sm shrink-0"
                              width={56} height={56}
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-stone-100 flex items-center justify-center shrink-0 shadow-inner">
                              <span className="text-stone-400 text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                {review.name.charAt(0)}
                              </span>
                            </div>
                          )}

                          {/* Name & Stars */}
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-bold tracking-widest text-stone-900 dark:text-foreground uppercase">{review.name}</p>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${i < review.rating ? 'text-amber-400 drop-shadow-sm' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Desktop Verified Pill Right-Aligned */}
                        <div className="hidden sm:flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Verified Buyer</span>
                        </div>
                      </div>

                      {/* Mobile Verified Pill Below Header */}
                      <div className="sm:hidden flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-3 py-1.5 rounded-full w-fit shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Verified Buyer</span>
                      </div>

                      {/* Review Text Body */}
                      <p className="text-[15px] sm:text-base text-stone-700 dark:text-muted-foreground leading-relaxed font-medium">
                        &ldquo;{review.review}&rdquo;
                      </p>

                      {/* Emphasized Customer Photo Attachment */}
                      {review.customer_product_image && (
                        <button
                          type="button"
                          aria-label="View uploaded image"
                          className="mt-2 w-28 h-28 sm:w-36 sm:h-36 group relative overflow-hidden rounded-xl border border-stone-200/60 shadow-md cursor-pointer shrink-0 p-0"
                          onClick={() => setExpandedImage(review)}
                        >
                          <Image
                            data={review.customer_product_image}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            sizes="150px"
                          />
                          <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors duration-300 pointer-events-none flex items-center justify-center">
                            <div className="bg-white/90 dark:bg-card/90 backdrop-blur-md text-stone-900 dark:text-foreground rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg border border-stone-100 dark:border-border">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-stone-500 italic">No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>

            {/* ── DEMO: Product Specs ── */}
            <div className="mt-12">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 dark:text-foreground mb-6 border-b border-stone-200 dark:border-border pb-4">
                Product Specifications
              </h3>
              <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-border">
                {[
                  { label: 'Origin', value: 'Nepal / Indonesia' },
                  { label: 'Mukhi (Faces)', value: '5 Mukhi' },
                  { label: 'Size', value: '18–22mm' },
                  { label: 'Weight', value: 'Approx. 4–6g' },
                  { label: 'String Material', value: 'Red silk thread' },
                  { label: 'Energisation', value: 'Prana Pratishtha performed' },
                  { label: 'Certification', value: 'GIA / IGI Lab Verified' },
                ].map((spec, i) => (
                  <div key={spec.label} className={`flex items-center justify-between px-5 py-4 text-xs ${i % 2 === 0 ? 'bg-stone-50 dark:bg-muted/50' : 'bg-white dark:bg-card'}`}>
                    <span className="text-stone-500 font-medium tracking-wide uppercase">{spec.label}</span>
                    <span className="text-stone-900 dark:text-foreground font-medium text-right capitalize">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: How to Wear ── */}
            <div className="mt-12">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 dark:text-foreground mb-6 border-b border-stone-200 dark:border-border pb-4">
                How to Wear & Care
              </h3>
              <div className="space-y-4">
                {[
                  { step: '01', title: 'Cleanse before wearing', desc: 'Wash the rudraksha with clean water on a Monday morning before first use.' },
                  { step: '02', title: 'Wear on the right wrist or neck', desc: 'For maximum benefit, wear touching the skin. Avoid synthetic clothing contact.' },
                  { step: '03', title: 'Monthly oil treatment', desc: 'Apply a drop of sandalwood or sesame oil monthly to keep the surface nourished.' },
                  { step: '04', title: 'Remove during sleep & bathing', desc: 'Take off during bathing and sleep to extend the life of the thread and bead.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5 items-start bg-white dark:bg-card border border-stone-200 dark:border-border rounded-2xl p-5 shadow-sm">
                    <span className="text-xl font-light text-stone-400 leading-none flex-shrink-0" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {item.step}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 dark:text-foreground mb-2">{item.title}</p>
                      <p className="text-xs text-stone-600 dark:text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: FAQs ── */}
            <div className="mt-12 mb-10">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-stone-900 dark:text-foreground mb-6 border-b border-stone-200 dark:border-border pb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-0 border-t border-stone-200 dark:border-border">
                {[
                  { q: 'Is this product genuine?', a: 'Yes — every product at Devasutra is sourced directly and verified by our in-house gemological team. A lab certificate is included with every order.' },
                  { q: 'How long does shipping take?', a: 'We ship Pan-India within 1–2 business days. Delivery typically takes 3–7 business days depending on your location.' },
                  { q: 'Can I return this product?', a: 'We accept returns within 7 days of delivery in original, unworn condition. Please contact our support team to initiate a return.' },
                  { q: 'Will I receive a certificate?', a: 'Yes. Every order includes a printed certificate of authenticity from our certified gemological lab.' },
                ].map((faq) => (
                  <details key={faq.q} className="group border-b border-stone-200 dark:border-border">
                    <summary className="flex items-center justify-between cursor-pointer py-5 select-none list-none outline-none">
                      <span className="text-[11px] font-semibold tracking-wide uppercase text-stone-900 dark:text-foreground pr-4">{faq.q}</span>
                      <svg className="w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="text-sm text-stone-600 dark:text-muted-foreground leading-relaxed pb-6">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── "You May Also Like" placeholder ── */}
        <section className="mt-20 md:mt-32 border-t border-stone-200 dark:border-border pt-16">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-3">Handpicked For You</p>
            <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-foreground" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              You May Also Like
            </h2>
          </div>

          {/* Placeholder cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-card border border-stone-100 dark:border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer flex flex-col">
                <div className="aspect-square bg-stone-50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-stone-200 transition-transform duration-700 group-hover:scale-105">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
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
    quantityAvailable
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    tags
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
    variants(first: 50) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
    testimonials: metafield(namespace: "custom", key: "testimonials") {
      references(first: 20) {
        nodes {
          ... on Metaobject {
            fields {
              key
              value
              reference {
                 ... on MediaImage {
                    image {
                       url
                       width
                       height
                       altText
                    }
                 }
              }
            }
          }
        }
      }
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
