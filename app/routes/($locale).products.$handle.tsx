import { redirect, useLoaderData, Link } from 'react-router';
import type { Route } from './+types/($locale).products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  Image,
  Money,
  CartForm,
} from '@shopify/hydrogen';
import { ProductPrice } from '~/components/ProductPrice';
import { ProductForm } from '~/components/ProductForm';
import { ProductShare } from '~/components/ProductShare';
import { StickyAddToCart } from '~/components/StickyAddToCart';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useCartNotification } from '~/components/CartNotification';
import { useAside } from '~/components/Aside';
import {
  generateMeta,
  truncate,
  stripHtml,
  productSchema,
  breadcrumbSchema,
  jsonLd,
} from '~/lib/seo';
import { sanitizeHtml } from '~/lib/sanitizer';

export const meta: Route.MetaFunction = ({ data }) => {
  const product = (data as any)?.product;
  const origin = (data as any)?.seoOrigin || '';
  const title = `${product?.title ?? ''} | Devasutra`;
  const rawDesc = product?.description || '';
  const description = truncate(rawDesc, 155) || title;
  const ogImage = product?.featuredImage?.url || product?.images?.nodes?.[0]?.url || '';
  return generateMeta({
    title,
    description,
    canonical: `${origin}/products/${product?.handle || ''}`,
    ogType: 'product',
    ogImage,
  });
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  const origin = new URL(args.request.url).origin;
  return { ...criticalData, seoOrigin: origin };
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

  // Fetch recommended products (non-blocking — if it fails, we just show nothing)
  let recommendedProducts: any[] = [];
  try {
    const recData = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
      variables: { productId: product.id },
    });
    recommendedProducts = recData?.productRecommendations ?? [];
  } catch {
    // Silently fail — the section will just be hidden
  }

  return { product, recommendedProducts, seoOrigin: new URL(request.url).origin };
}

// ─── Main Product Component ───────────────────────────────────────────────────

export default function Product() {
  const { product, recommendedProducts } = useLoaderData<typeof loader>();
  const seoOrigin = ((useLoaderData<typeof loader>()) as any).seoOrigin || '';
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const productFormRef = useRef<HTMLDivElement>(null);
  const { open } = useAside();

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

  const pointerStartXRef = useRef<number | null>(null);
  const swipeThreshold = 48;

  useEffect(() => {
    if (selectedImageIndex > images.length - 1) {
      setSelectedImageIndex(0);
    }
  }, [images.length, selectedImageIndex]);

  const goToPreviousImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1,
    );
  };

  const goToNextImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1,
    );
  };

  const handleGalleryPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    pointerStartXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGalleryPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (images.length <= 1 || pointerStartXRef.current === null) return;

    const deltaX = event.clientX - pointerStartXRef.current;
    pointerStartXRef.current = null;

    if (Math.abs(deltaX) < swipeThreshold) return;

    if (deltaX > 0) {
      goToPreviousImage();
    } else {
      goToNextImage();
    }
  };

  const handleGalleryPointerCancel = () => {
    pointerStartXRef.current = null;
  };

  const handleGalleryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPreviousImage();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNextImage();
    }
  };

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
      id: node.id,
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
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            productSchema(
              product as any,
              seoOrigin,
              testimonials.length > 0
                ? { value: Number(avgRating), count: testimonials.length }
                : undefined,
            ),
          ),
        }}
      />
      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', url: `${seoOrigin}/` },
              { name: 'Products', url: `${seoOrigin}/collections/all` },
              { name: title, url: `${seoOrigin}/products/${product.handle}` },
            ]),
          ),
        }}
      />
      {/* Lightbox Modal for Customer Uploaded Product Images */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md transition-opacity duration-300">
          <button
            type="button"
            aria-label="Close image"
            className="absolute inset-0 border-0 p-0 bg-transparent"
            onClick={() => setExpandedImage(null)}
          />
          <div className="relative z-10 w-full max-w-5xl max-h-[95vh] flex items-center justify-center">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 sm:-right-8 sm:-top-8 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all backdrop-blur-sm z-20"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative flex justify-center items-center w-full max-h-[95vh]">
              <Image
                data={expandedImage.customer_product_image}
                className="w-auto h-auto max-w-full max-h-[95vh] object-contain rounded-xl shadow-2xl border border-white/10"
                sizes="100vw"
              />

              {/* Reviewer Details in Modal */}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-stone-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 w-[calc(100%-2rem)] max-w-md shadow-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedImage.customer_image ? (
                      <Image data={expandedImage.customer_image} className="w-10 h-10 rounded-full object-cover border border-white/20" width={40} height={40} sizes="40px" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center">
                        <span className="text-stone-300 text-lg font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{expandedImage.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold tracking-widest text-white uppercase">{expandedImage.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`w-3.5 h-3.5 ${star <= expandedImage.rating ? 'text-amber-400 drop-shadow-sm' : 'text-stone-600'}`} fill="currentColor" viewBox="0 0 20 20">
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
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-24">


        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 lg:items-start">

          {/* ── LEFT: Image Gallery ── */}
          <div className="lg:sticky lg:top-42">

            {/* Main Image */}
            <div
              className="aspect-square overflow-hidden rounded-[2rem] bg-linear-to-b from-white to-stone-100/60 dark:from-card dark:to-card/70 border border-stone-200/70 dark:border-border shadow-[0_20px_45px_-26px_rgba(0,0,0,0.5)] mb-4 relative group select-none cursor-grab active:cursor-grabbing"
              onPointerDown={handleGalleryPointerDown}
              onPointerUp={handleGalleryPointerUp}
              onPointerCancel={handleGalleryPointerCancel}
              onPointerLeave={handleGalleryPointerCancel}
              onKeyDown={handleGalleryKeyDown}
              onDragStart={(event) => event.preventDefault()}
              role="button"
              aria-roledescription="carousel"
              tabIndex={images.length > 1 ? 0 : -1}
              aria-label="Product image gallery"
              style={{ touchAction: 'pan-y' }}
            >
              {images[selectedImageIndex] && (
                <Image
                  data={images[selectedImageIndex]}
                  className="w-full h-full object-cover"
                  draggable={false}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              )}
              {/* Subtle gradient vignette on hover */}
              <div className="absolute inset-0 bg-linear-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={goToPreviousImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 dark:bg-black/45 backdrop-blur-md border border-stone-200/80 dark:border-white/15 text-stone-700 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={goToNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 dark:bg-black/45 backdrop-blur-md border border-stone-200/80 dark:border-white/15 text-stone-700 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </>
              )}
              {/* Image counter badge */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-card/90 backdrop-blur-md text-stone-700 dark:text-foreground px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider shadow-lg ">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {images.map((img, idx) => (
                  <button
                    key={img.url}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`shrink-0 snap-start w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                      idx === selectedImageIndex
                        ? 'border-stone-900 dark:border-foreground shadow-lg  opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-stone-300 dark:hover:border-border'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={idx === selectedImageIndex}
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

          {/* ── RIGHT: Product Info ── */}
          <div className="lg:py-2 flex flex-col">

            {/* Vendor + Stock */}
            <div className="flex items-center flex-wrap gap-3 mb-5">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-all duration-200 ${selectedVariant?.availableForSale
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${selectedVariant?.availableForSale ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {selectedVariant?.availableForSale ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Tags */}
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {displayTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-stone-50 dark:bg-card border border-stone-200/70 dark:border-border text-[10px] tracking-widest uppercase font-semibold text-stone-600 dark:text-muted-foreground hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-default"
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
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(Number(avgRating)) ? 'text-stone-900 dark:text-foreground' : 'text-stone-200 dark:text-border'}`} fill="currentColor" viewBox="0 0 20 20">
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
            <div className="mb-8 relative pl-6">
              <div className="absolute left-0 top-0 bottom-0 w-0.75 rounded-full bg-linear-to-b from-amber-400/80 via-amber-300/40 to-transparent" />
              <p className="text-base text-stone-600 dark:text-muted-foreground leading-relaxed italic">
                Handpicked and energised with Vedic mantras — crafted to bring harmony, protection, and spiritual clarity to your daily life.
              </p>
            </div>



            {/* Product Form */}
            <div ref={productFormRef}>
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
              />
            </div>

            {/* Stock count — plain text below size buttons */}
            {(() => {
              const variantNodes = (product as any).variants?.nodes as any[] | undefined;
              const matchedVariant = variantNodes?.find((v: any) => v.id === selectedVariant?.id);
              const qty = matchedVariant?.quantityAvailable;
              if (qty == null) return null;
              const isLow = qty <= 5;
              return (
                <p className={`text-lg font-semibold mt-4 ${isLow ? 'text-red-600' : 'text-stone-700 dark:text-muted-foreground'
                  }`}>
                  {isLow && '⚠ '}Only {qty} left in stock{isLow ? ' — order soon!' : ''}
                </p>
              );
            })()}

            <ProductShare title={title} />


            {/* Decorative Divider */}
            <div className="relative my-10">
              <div className="h-px bg-linear-to-r from-transparent via-stone-300 dark:via-border to-transparent" />
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-background px-3">
                <div className="w-1.5 h-1.5 bg-stone-300 dark:bg-border rotate-45" />
              </div>
            </div>

            {/* Trust mini-badges */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-8">
              {[
                {
                  id: 'auth',
                  text: '100% Authentic',
                  sub: 'Ethically sourced',
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  ),
                },
                {
                  id: 'lab',
                  text: 'Lab Certified',
                  sub: 'Certificate included',
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  ),
                },
                {
                  id: 'ship',
                  text: 'Free Shipping',
                  sub: 'Above ₹999',
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  ),
                },
                {
                  id: 'ret',
                  text: 'Easy Returns',
                  sub: '7-day policy',
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                    </svg>
                  ),
                },
              ].map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center text-center gap-2 py-4 px-3 bg-stone-50 dark:bg-muted/30 rounded-xl border border-stone-100 dark:border-border/60 transition-colors duration-200"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-background border border-stone-200 dark:border-border flex items-center justify-center text-stone-700 dark:text-foreground">
                    {badge.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-stone-800 dark:text-foreground leading-tight">{badge.text}</p>
                    <p className="text-[10px] text-stone-500 dark:text-muted-foreground leading-tight">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description accordion */}
            <div className="space-y-0">
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
                <details key={section.id} open={section.defaultOpen} className="group border-b border-stone-200/60 dark:border-border/60">
                  <summary className="flex items-center justify-between cursor-pointer py-5 sm:py-6 select-none list-none outline-none hover:bg-stone-50/50 dark:hover:bg-muted/20 -mx-2 px-2 rounded-lg transition-colors duration-200">
                    <h3 className="text-[12px] font-bold tracking-widest uppercase text-stone-900 dark:text-foreground">
                      {section.title}
                    </h3>
                    {/* Plus/Minus icon */}
                    <div className="w-6 h-6 rounded-full border border-stone-300 dark:border-border flex items-center justify-center shrink-0 group-open:bg-stone-900 group-open:border-stone-900 dark:group-open:bg-foreground dark:group-open:border-foreground transition-all duration-300">
                      <svg
                        className="w-3 h-3 text-stone-500 group-open:text-white dark:group-open:text-background transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12" className="group-open:opacity-0 transition-opacity duration-200" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
                      </svg>
                    </div>
                  </summary>
                  <div className="pb-6 text-sm text-stone-600 dark:text-muted-foreground leading-relaxed pl-0.5">
                    {section.html ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-stone-900 dark:prose-headings:text-foreground prose-a:text-stone-900 dark:prose-a:text-foreground underline-offset-4"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.html) }}
                      />
                    ) : (
                      <p>{section.content}</p>
                    )}
                  </div>
                </details>
              ))}
            </div>

            {/* ── LIVE: Reviews ── */}
            <div id="reviews" className="mt-14 scroll-mt-24">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-1.5">What our customers say</p>
                  <h3 className="text-2xl font-light text-stone-900 dark:text-foreground" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Customer Reviews
                  </h3>
                </div>
                {testimonials.length > 0 && (
                  <div className="flex items-center gap-2.5 bg-stone-50 dark:bg-muted/30 border border-stone-200/60 dark:border-border rounded-xl px-4 py-2.5">
                    <span className="text-2xl font-light text-stone-900 dark:text-foreground" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{avgRating}</span>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`w-3 h-3 ${star <= Math.round(Number(avgRating)) ? 'text-amber-400' : 'text-stone-200 dark:text-border'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[9px] text-stone-500 dark:text-muted-foreground tracking-wider uppercase font-medium">{testimonials.length} review{testimonials.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>

              {testimonials.length > 0 ? (
                <div className="space-y-5">
                  {testimonials.map((review: any) => (
                    <div key={review.id} className="relative bg-white dark:bg-card border border-stone-200/60 dark:border-border rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow duration-300 flex flex-col gap-5 overflow-hidden">
                      {/* Decorative quote mark */}
                      <div className="absolute top-4 right-5 text-stone-100 dark:text-border/30 text-6xl font-serif leading-none pointer-events-none select-none" aria-hidden="true">”</div>

                      {/* Top Header Row */}
                      <div className="flex items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar Element */}
                          {review.customer_image ? (
                            <Image
                              data={review.customer_image}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-stone-100 shadow-sm shrink-0"
                              width={56} height={56}
                              sizes="56px"
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
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${star <= review.rating ? 'text-amber-400 drop-shadow-sm' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
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
            <div className="mt-14">
              <div className="mb-6">
                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-1.5">Details</p>
                <h3 className="text-2xl font-light text-stone-900 dark:text-foreground" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Product Specifications
                </h3>
              </div>
              <div className="rounded-2xl overflow-hidden border border-stone-200/60 dark:border-border shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
                {[
                  { label: 'Origin', value: 'Nepal / Indonesia' },
                  { label: 'Mukhi (Faces)', value: '5 Mukhi' },
                  { label: 'Size', value: '18–22mm' },
                  { label: 'Weight', value: 'Approx. 4–6g' },
                  { label: 'String Material', value: 'Red silk thread' },
                  { label: 'Energisation', value: 'Prana Pratishtha performed' },
                  { label: 'Certification', value: 'GIA / IGI Lab Verified' },
                ].map((spec, i) => (
                  <div key={spec.label} className={`flex items-center justify-between px-5 py-4 text-xs transition-colors duration-150 hover:bg-amber-50/40 dark:hover:bg-amber-900/5 ${i % 2 === 0 ? 'bg-stone-50/80 dark:bg-muted/30' : 'bg-white dark:bg-card'} ${i < 6 ? 'border-b border-stone-100 dark:border-border/40' : ''}`}>
                    <span className="text-stone-500 dark:text-muted-foreground font-medium tracking-wide uppercase">{spec.label}</span>
                    <span className="text-stone-900 dark:text-foreground font-semibold text-right capitalize">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DEMO: How to Wear ── */}
            <div className="mt-14">
              <div className="mb-8">
                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-1.5">Guide</p>
                <h3 className="text-2xl font-light text-stone-900 dark:text-foreground" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  How to Wear & Care
                </h3>
              </div>
              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-4.75 top-8 bottom-8 w-px bg-linear-to-b from-amber-300/60 via-amber-200/40 to-transparent dark:from-amber-700/40 dark:via-amber-800/20" />
                <div className="space-y-4">
                  {[
                    { step: '01', title: 'Cleanse before wearing', desc: 'Wash the rudraksha with clean water on a Monday morning before first use.' },
                    { step: '02', title: 'Wear on the right wrist or neck', desc: 'For maximum benefit, wear touching the skin. Avoid synthetic clothing contact.' },
                    { step: '03', title: 'Monthly oil treatment', desc: 'Apply a drop of sandalwood or sesame oil monthly to keep the surface nourished.' },
                    { step: '04', title: 'Remove during sleep & bathing', desc: 'Take off during bathing and sleep to extend the life of the thread and bead.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-5 items-start group hover:-translate-y-0.5 transition-all duration-300">
                      {/* Step circle */}
                      <div className="relative z-10 w-10 h-10 rounded-full bg-white dark:bg-card border-2 border-gold dark:border-gold flex items-center justify-center shrink-0 shadow-sm group-hover:border-amber-400 group-hover:shadow-md transition-all duration-300">
                        <span className="text-[11px] font-bold text-gold dark:text-gold tracking-wide">
                          {item.step}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-card border border-stone-200/60 dark:border-border rounded-2xl p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex-1 group-hover:shadow-md transition-all duration-300">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-stone-900 dark:text-foreground mb-2">{item.title}</p>
                        <p className="text-xs text-stone-600 dark:text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── DEMO: FAQs ── */}
            <div className="mt-14 mb-10">
              <div className="mb-8">
                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-1.5">Support</p>
                <h3 className="text-2xl font-light text-stone-900 dark:text-foreground" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Frequently Asked Questions
                </h3>
              </div>
              <div className="bg-white dark:bg-card border border-stone-200/60 dark:border-border rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
                {[
                  { q: 'Is this product genuine?', a: 'Yes — every product at Devasutra is sourced directly and verified by our in-house gemological team. A lab certificate is included with every order.' },
                  { q: 'How long does shipping take?', a: 'We ship Pan-India within 1–2 business days. Delivery typically takes 3–7 business days depending on your location.' },
                  { q: 'Can I return this product?', a: 'We accept returns within 7 days of delivery in original, unworn condition. Please contact our support team to initiate a return.' },
                  { q: 'Will I receive a certificate?', a: 'Yes. Every order includes a printed certificate of authenticity from our certified gemological lab.' },
                ].map((faq, i) => (
                  <details key={faq.q} className={`group ${i < 3 ? 'border-b border-stone-100 dark:border-border/40' : ''}`}>
                    <summary className="flex items-center justify-between cursor-pointer py-5 sm:py-6 px-6 select-none list-none outline-none hover:bg-stone-50/60 dark:hover:bg-muted/20 transition-colors duration-200">
                      <span className="text-[13px] font-semibold text-stone-900 dark:text-foreground pr-4 leading-snug">{faq.q}</span>
                      {/* Plus/Minus icon */}
                      <div className="w-6 h-6 rounded-full border border-stone-300 dark:border-border flex items-center justify-center shrink-0 group-open:bg-stone-900 group-open:border-stone-900 dark:group-open:bg-foreground dark:group-open:border-foreground transition-all duration-300">
                        <svg
                          className="w-3 h-3 text-stone-500 group-open:text-white dark:group-open:text-background transition-colors duration-300"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12" className="group-open:opacity-0 transition-opacity duration-200" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
                        </svg>
                      </div>
                    </summary>
                    <div className="px-6 pb-6">
                      <p className="text-sm text-stone-600 dark:text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── "You May Also Like" ── */}
        <RecommendedProducts products={recommendedProducts} />
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

      {/* Sticky Add-to-Cart Bar */}
      <StickyAddToCart
        selectedVariant={selectedVariant}
        product={{
          title: product.title,
          featuredImage: images[0] ?? null,
        }}
        triggerRef={productFormRef}
        onAddToCartClick={() => open('cart')}
      />
    </div>
  );
}

// ─── Recommended Products ─────────────────────────────────────────────────────

function RecommendedProducts({ products }: { products: any[] }) {
  const displayProducts = products?.slice(0, 4) ?? [];

  if (displayProducts.length === 0) return null;

  return (
    <section className="mt-20 md:mt-32 pt-16 relative">
      {/* Decorative section divider */}
      <div className="absolute top-0 left-0 right-0">
        <div className="h-px bg-linear-to-r from-transparent via-stone-300 dark:via-border to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-background px-4 flex items-center gap-2">
          <div className="w-6 h-px bg-stone-300 dark:bg-border" />
          <div className="w-1.5 h-1.5 bg-stone-300 dark:bg-border rotate-45" />
          <div className="w-6 h-px bg-stone-300 dark:bg-border" />
        </div>
      </div>

      <div className="text-center mb-12">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-3">
          Handpicked For You
        </p>
        <h2
          className="text-3xl md:text-4xl font-light text-stone-900 dark:text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          You May Also Like
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-5">
        {displayProducts.map((product: any, index: number) => (
          <div
            key={product.id}
            className="group bg-card text-card-foreground border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
          >
            <Link
              to={`/products/${product.handle}`}
              prefetch="intent"
              className="no-underline block aspect-square bg-muted relative overflow-hidden"
            >
              {product.featuredImage ? (
                <Image
                  data={product.featuredImage}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading={index < 2 ? 'eager' : 'lazy'}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl opacity-20 text-muted-foreground">
                    ✦
                  </span>
                </div>
              )}
            </Link>

            <div className="p-3 sm:p-3.5 flex flex-col flex-1 gap-1.5">
              <Link
                to={`/products/${product.handle}`}
                prefetch="intent"
                className="no-underline block"
              >
                <h3 className="text-sm sm:text-[15px] lg:text-base xl:text-lg font-medium text-foreground leading-snug line-clamp-2 group-hover:underline underline-offset-4 transition-all">
                  {product.title}
                </h3>
              </Link>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <div className="text-base sm:text-lg font-semibold text-foreground">
                  <Money withoutTrailingZeros data={product.priceRange.minVariantPrice} />
                </div>

                <CartForm
                  route="/cart"
                  inputs={{
                    lines: [
                      {
                        merchandiseId: product.variants?.nodes?.[0]?.id,
                        quantity: 1,
                      },
                    ],
                  }}
                  action={CartForm.ACTIONS.LinesAdd}
                >
                  {(fetcher) => (
                    <RelatedProductAddButton
                      fetcher={fetcher}
                      availableForSale={product.variants?.nodes?.[0]?.availableForSale}
                      productTitle={product.title}
                    />
                  )}
                </CartForm>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RelatedProductAddButton({
  fetcher,
  availableForSale,
  productTitle,
}: {
  fetcher: any;
  availableForSale?: boolean;
  productTitle: string;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle]);

  const isDisabled = !availableForSale || fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black text-[10px] font-medium tracking-wide uppercase rounded-full transition-colors hover:bg-neutral-800 dark:hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
      aria-label="Add to cart"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5h.008v.008h-.008v-.008Zm5.375 0h.008v.008h-.008v-.008Z"
        />
      </svg>
      {availableForSale ? 'Add' : 'Sold Out'}
    </button>
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

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query RecommendedProducts(
    $productId: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      id
      title
      handle
      featuredImage {
        id
        altText
        url
        width
        height
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 1) {
        nodes {
          id
          availableForSale
        }
      }
    }
  }
` as const;
