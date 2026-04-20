import { redirect, useLoaderData, Link, Await, useRouteLoaderData } from 'react-router';
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
import { ProductPrice } from '~/features/product/components/ProductPrice';
import { ProductForm } from '~/features/product/components/ProductForm';
import { ProductShare } from '~/features/product/components/ProductShare';
import { StickyAddToCart } from '~/features/product/components/StickyAddToCart';
import { JudgeMeReviews } from '~/features/product/components/JudgeMeReviews';
import { JudgeMeReviewForm } from '~/features/product/components/JudgeMeReviewForm';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { Suspense, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useCartNotification } from '~/features/cart/components/CartNotification';
import { useAside } from '~/shared/components/Aside';
import {
  generateMeta,
  truncate,
  stripHtml,
  productSchema,
  breadcrumbSchema,
  jsonLd,
} from '~/lib/seo';
import { sanitizeHtml } from '~/lib/sanitizer';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

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

  // Fetch Judge.me reviews (non-blocking â€" if it fails, we just show nothing)
  let judgeme: any = null;
  const judgeMeToken = context.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  const judgemeRequireLogin =
    context.env.JUDGEME_REQUIRE_LOGIN_FOR_REVIEW === 'true' ||
    context.env.JUDGEME_REQUIRE_LOGIN_FOR_REVIEW === '1';
  const judgemeEnabled =
    typeof judgeMeToken === 'string' && typeof shopDomain === 'string';
  if (judgemeEnabled) {
    const shopifyProductId = String(product.id).split('/').pop();
    if (shopifyProductId) {
      try {
        const { getJudgeMeProductReviews } = await import('~/lib/judgeme.server');
        judgeme = await getJudgeMeProductReviews({
          shopDomain,
          apiToken: judgeMeToken,
          shopifyProductId,
          productHandle: handle,
          perPage: 10,
        });
      } catch {
        // ignore
      }
    }
  }

  return { product, recommendedProducts, judgeme, judgemeEnabled, judgemeRequireLogin, seoOrigin: new URL(request.url).origin };
}

// ─── Main Product Component ───────────────────────────────────────────────────

export default function Product() {
  const data = useLoaderData<typeof loader>() as any;
  const { product, recommendedProducts, judgeme, judgemeEnabled, judgemeRequireLogin } = data;
  const seoOrigin = data?.seoOrigin || '';
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
    product.images.nodes.forEach((img: any) => {
      const normalized = normalizeImage(img);
      if (!images.find((i) => i.url === normalized.url)) {
        images.push(normalized);
      }
    });
  }

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const userScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth scroll thumbnail container (desktop up/down buttons)
  const scrollThumbnails = (direction: 'up' | 'down') => {
    const next = direction === 'down'
      ? Math.min(selectedImageIndex + 1, images.length - 1)
      : Math.max(selectedImageIndex - 1, 0);
    scrollToImage(next);
  };

  // Click on thumbnail / nav button -> scroll main gallery to target image
  const scrollToImage = (index: number) => {
    isUserScrolling.current = true;
    setSelectedImageIndex(index);

    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    userScrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 800);

    const target = imageRefs.current[index];
    if (!target) return;

    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    } else {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  // Desktop scroll spy — pick the image whose center is closest to viewport center
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number;
    const handleScroll = () => {
      if (window.innerWidth < 1024) return;
      if (isUserScrolling.current) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const viewportCenter = window.innerHeight / 2;
        let bestIndex = 0;
        let bestDist = Infinity;

        imageRefs.current.forEach((img, idx) => {
          if (!img) return;
          const rect = img.getBoundingClientRect();
          // Skip images completely off-screen
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          const imgCenter = rect.top + rect.height / 2;
          const dist = Math.abs(imgCenter - viewportCenter);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = idx;
          }
        });

        // Only update if at least one image was found in the viewport —
        // when the user scrolls past all images (e.g. into "You May Also Like"),
        // bestDist stays Infinity and we should leave the index unchanged so the
        // thumbnail auto-scroll effect doesn't pull the page back up.
        if (bestDist < Infinity) {
          setSelectedImageIndex(bestIndex);
        }
      });
    };

    // Run once on mount to set correct initial index
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
      if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    };
  }, [images.length]);

  // Mobile horizontal scroll sync
  useEffect(() => {
    const container = mainScrollRef.current;
    if (!container) return;

    let rafId: number;
    const handleScroll = () => {
      if (window.innerWidth >= 1024) return;
      if (isUserScrolling.current) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;
        let closestIndex = 0;
        let closestDist = Infinity;
        imageRefs.current.forEach((img, idx) => {
          if (!img) return;
          const imgCenter = img.offsetLeft + img.offsetWidth / 2;
          const viewCenter = scrollLeft + containerWidth / 2;
          const dist = Math.abs(imgCenter - viewCenter);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = idx;
          }
        });
        setSelectedImageIndex(closestIndex);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [images.length]);

  // Auto-scroll desktop thumbnail strip to keep active thumbnail visible.
  // We manually scroll only the thumbnail container (not the window) to avoid
  // scrollIntoView() pulling the page back up when the sticky sidebar's static
  // layout position is above the current scroll position.
  useEffect(() => {
    if (!thumbnailContainerRef.current) return;
    const container = thumbnailContainerRef.current;

    if (selectedImageIndex === 0) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const activeThumb = container.children[selectedImageIndex] as HTMLElement;
    if (!activeThumb) return;

    const thumbTop = activeThumb.offsetTop;
    const thumbBottom = thumbTop + activeThumb.offsetHeight;
    const containerScrollTop = container.scrollTop;
    const containerVisible = container.clientHeight;

    if (thumbTop < containerScrollTop + 8) {
      container.scrollTo({ top: Math.max(0, thumbTop - 8), behavior: 'smooth' });
    } else if (thumbBottom > containerScrollTop + containerVisible) {
      container.scrollTo({ top: thumbBottom - containerVisible, behavior: 'smooth' });
    }
  }, [selectedImageIndex]);

  const [expandedImage, setExpandedImage] = useState<any>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareIn, setShareIn] = useState(false);

  const openShare = () => {
    setShareOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShareIn(true)));
  };
  const closeShare = () => {
    setShareIn(false);
    setTimeout(() => setShareOpen(false), 300);
  };

  const judgeMeReviews = Array.isArray(judgeme?.reviews) ? judgeme.reviews : [];
  const ratingValue = typeof judgeme?.summary?.averageRating === 'number' ? judgeme.summary.averageRating : 0;
  const ratingCount = typeof judgeme?.summary?.reviewCount === 'number' ? judgeme.summary.reviewCount : 0;
  const ratingLabel = ratingValue > 0 ? ratingValue.toFixed(1) : '0';
  const hasRating = ratingCount > 0;
  const shopifyProductId = String(product?.id ?? '').split('/').pop() || '';
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const rootData = useRouteLoaderData('root') as any;

  return (
    <div className="min-h-screen text-gray-900 dark:text-foreground bg-white dark:bg-background">
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            productSchema(
              product as any,
              seoOrigin,
              hasRating ? { value: ratingValue, count: ratingCount } : undefined,
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
                        <span className="text-stone-300 text-lg font-light" style={{ fontFamily: "'Cormorant Variable', Georgia, serif" }}>{expandedImage.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold tracking-widest text-white uppercase">{expandedImage.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`w-3.5 h-3.5 ${star <= expandedImage.rating ? 'text-[#F14514]' : 'text-stone-600'}`} fill="currentColor" viewBox="0 0 20 20">
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
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 md:py-12">

        {/* Breadcrumb */}
        <RouteBreadcrumbBanner
          variant="light"
          className="border-0"
          containerClassName="px-0 py-0 pb-6 md:pb-8"
        />

        {/* Product Grid */}
        <div className="grid lg:grid-cols-[55%_1fr] gap-10 lg:gap-14 lg:items-start">

          {/* ── LEFT: Image Gallery ── */}
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-5 relative w-full overflow-hidden lg:overflow-visible lg:sticky lg:top-[96px] lg:h-[max-content]">

            {/* Desktop Thumbnails (Sticky sidebar) */}
            {images.length > 1 && (
              <div className="hidden lg:block w-20 lg:w-24 shrink-0 relative">
                <div className="sticky top-24 flex flex-col items-center gap-2">
                  <button
                    onClick={() => scrollThumbnails('up')}
                    className="w-full py-2 rounded-full border border-black/30 dark:border-white/30 bg-white flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>

                  <div
                    ref={thumbnailContainerRef}
                    className="max-h-84 overflow-y-auto overflow-x-hidden flex flex-col gap-3 py-1 px-0.5 no-scrollbar scroll-smooth"
                  >
                    {images.map((img, idx) => (
                      <button
                        key={img.url}
                        onClick={() => scrollToImage(idx)}
                        className={`shrink-0 w-20 h-20 rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer border-[2.5px] ${idx === selectedImageIndex
                          ? 'border-white ring-1 ring-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                          : 'border-transparent opacity-80 hover:opacity-100 hover:border-white/60'
                          }`}
                        aria-pressed={idx === selectedImageIndex}
                      >
                        <Image
                          data={img}
                          className="w-full h-full object-cover sm:object-contain object-center mix-blend-multiply rounded-xl"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => scrollThumbnails('down')}
                    className="w-full py-2 rounded-full border border-black/30 dark:border-white/30 bg-white flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Main Stage (Stacked natively on Desktop, Snap scroll on Mobile) */}
            {/* Main Image Scroll */}
            <div ref={mainScrollRef} className="flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none gap-3 lg:gap-6 no-scrollbar">
              {images.map((img, idx) => (
                <div
                  key={img.url}
                  ref={(el) => (imageRefs.current[idx] = el)}
                  data-index={idx}
                  className="w-full shrink-0 snap-center rounded-[24px] bg-[#F6F6F6] aspect-[3/2] sm:aspect-square relative flex items-center justify-center"
                >
                  <Image
                    data={img}
                    className="w-full h-full object-cover sm:object-contain object-center mix-blend-multiply rounded-xl"
                    draggable={false}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
              ))}
            </div>

            {/* ✅ MOBILE THUMBNAILS WITH NAV BUTTONS */}
            {images.length > 1 && (
              <div className="lg:hidden mt-3 px-1">
                <div className="flex items-center justify-center gap-2.5">
                  {/* Left arrow */}
                  <button
                    onClick={() => scrollToImage(Math.max(0, selectedImageIndex - 1))}
                    disabled={selectedImageIndex === 0}
                    className="shrink-0 w-9 h-9 rounded-full border border-black bg-white flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  {/* Thumbnails */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={img.url}
                        onClick={() => scrollToImage(idx)}
                        className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-300 border-2 ${idx === selectedImageIndex
                          ? 'border-gray-900 shadow-md'
                          : 'border-transparent opacity-80 hover:opacity-100 hover:border-gray-300'
                          }`}
                        aria-pressed={idx === selectedImageIndex}
                      >
                        <Image
                          data={img}
                          className="w-full h-full object-cover"
                          sizes="56px"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Right arrow */}
                  <button
                    onClick={() => scrollToImage(Math.min(images.length - 1, selectedImageIndex + 1))}
                    disabled={selectedImageIndex === images.length - 1}
                    className="shrink-0 w-9 h-9 rounded-full border border-black bg-white flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="lg:py-2 flex flex-col">

            {/* ╔══ Single bordered product panel ══╗ */}
            <div className="relative border border-stone-200 rounded-2xl bg-white overflow-hidden mb-6">

              {/* Share button — absolute top-right */}
              <button
                type="button"
                onClick={openShare}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50 transition-all duration-200"
                aria-label="Share this product"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
              </button>

              {/* ── Main info (padded) ── */}
              <div className="px-5 pt-5 pb-4">

                {/* Out of Stock badge */}
                {!selectedVariant?.availableForSale && (
                  <div className="flex items-center sm:justify-start gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wide font-bold text-[#F14514] border border-black/10">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                      CURRENTLY UNAVAILABLE
                    </span>
                  </div>
                )}

                {/* Title — leave space for share button */}
                <h1 className="text-3xl sm:text-3xl lg:text-4xl font-medium text-gray-900 leading-[1.15] mb-2 tracking-tight pr-12 font-heading">
                  {title}
                </h1>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                  <div className="text-xl sm:text-2xl text-gray-900">
                    <ProductPrice
                      price={selectedVariant?.price}
                      compareAtPrice={selectedVariant?.compareAtPrice}
                    />
                  </div>
                </div>

                {/* Live Rating */}
                {hasRating && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-foreground tabular-nums">
                      {ratingLabel}
                    </span>
                    <div className="flex gap-0.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-4 h-4 ${star <= Math.round(ratingValue) ? 'text-[#F14514]' : 'text-gray-200 dark:text-stone-700'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                        </svg>
                      ))}
                    </div>
                    <span className="h-4 w-px bg-stone-300 dark:bg-border" aria-hidden="true" />
                    <a href="#reviews" className="text-[11px] text-gray-500 dark:text-muted-foreground tracking-wider uppercase font-medium hover:text-gray-900 dark:hover:text-foreground transition-colors">
                      {ratingCount} review{ratingCount !== 1 ? 's' : ''}
                    </a>
                  </div>
                )}

                {/* Tags */}
                {displayTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {displayTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] tracking-widest uppercase bg-linear-to-br from-[#f14514] to-[#d4370d] text-white"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Coupon card (only when metafield is set) ── */}
              {(() => {
                const code = (product as any).coupon_code?.value as string | undefined;
                const label = (product as any).coupon_label?.value as string | undefined;
                const offer = (product as any).coupon_offer?.value as string | undefined;
                if (!code) return null;
                return <CouponCard code={code} label={label} offer={offer} />;
              })()}

              {/* ── Divider ── */}
              <div className="mx-5 border-t border-stone-100 dark:border-border" />

              {/* ── Product Form ── */}
              <div className="px-5 pt-4 pb-4" ref={productFormRef}>
                <ProductForm
                  productOptions={productOptions}
                  selectedVariant={selectedVariant}
                  productTitle={title}
                  productImage={images[0] ?? null}
                  stockQty={(() => {
                    const nodes = (product as any).variants?.nodes as any[] | undefined;
                    const match = nodes?.find((v: any) => v.id === selectedVariant?.id);
                    return match?.quantityAvailable ?? null;
                  })()}
                />
              </div>

            </div>
            {/* ╚══ End bordered product panel ══╝ */}

            {/* Accordions — connected group, content driven from Shopify metafields */}
            {(() => {
              const productFeaturesHtml = (product as any).product_features?.value ?? null;
              const shippingReturnsText = (product as any).shipping_returns?.value ?? null;

              const sections = [
                ...(productFeaturesHtml ? [{
                  id: 'features',
                  title: 'Product Features',
                  html: productFeaturesHtml,
                  content: null,
                  defaultOpen: true,
                }] : []),
                {
                  id: 'description',
                  title: 'Description',
                  html: descriptionHtml,
                  content: null,
                  defaultOpen: !productFeaturesHtml,
                },
                ...(shippingReturnsText ? [{
                  id: 'shipping',
                  title: 'Shipping & Returns',
                  html: null,
                  content: shippingReturnsText,
                  defaultOpen: false,
                }] : [{
                  id: 'shipping',
                  title: 'Shipping & Returns',
                  html: null,
                  content: 'We ship Pan-India. Orders above ₹999 qualify for free shipping. Delivery in 3–7 business days. Returns accepted within 7 days of receipt in original condition.',
                  defaultOpen: false,
                }]),
              ];

              return (
                <div className="mb-10 border border-gray-200 dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card divide-y divide-gray-200 dark:divide-border">
                  {sections.map((section) => (
                    <details key={section.id} open={section.defaultOpen} className="group">
                      <summary className="flex items-center justify-between cursor-pointer px-5 py-4 select-none list-none outline-none hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors duration-200">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-foreground tracking-wide">
                          {section.title}
                        </h3>
                        <div className="flex items-center justify-center shrink-0 ml-4">
                          <svg
                            className="w-4 h-4 text-gray-400 dark:text-muted-foreground transition-transform duration-300 group-open:rotate-180"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </summary>
                      <div className="px-5 pb-5 pt-3 text-sm text-gray-600 dark:text-muted-foreground leading-relaxed border-t border-gray-100 dark:border-border">
                        {section.html ? (
                          <div
                            className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-foreground prose-a:text-gray-900 dark:prose-a:text-foreground dark:prose-invert underline-offset-4"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.html) }}
                          />
                        ) : (
                          <p>{section.content}</p>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              );
            })()}

            {/* Trust mini-badges Row */}
            <div className="mb-8">
              <img
                src="/qualities.png"
                alt="Our qualities"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>

            {/* ── Reviews ── */}
            <div id="reviews" className="mt-14 scroll-mt-24">

              {/* Section heading */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-1.5">
                    What Our Customers Say
                  </p>
                  <h3
                    className="text-2xl sm:text-[28px] font-light text-stone-900 dark:text-foreground leading-tight"
                    style={{ fontFamily: "'Cormorant Variable', Georgia, serif" }}
                  >
                    Customer Reviews
                  </h3>
                </div>

                {/* Write-review CTA */}
                {judgemeEnabled && (
                  judgemeRequireLogin ? (
                    <Suspense fallback={
                      <button type="button" disabled className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 dark:border-border text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-muted-foreground cursor-not-allowed">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                        Write a Review
                      </button>
                    }>
                      <Await resolve={rootData?.isLoggedIn}>
                        {(isLoggedIn: boolean) =>
                          isLoggedIn ? (
                            <button
                              type="button"
                              disabled={!shopifyProductId}
                              onClick={() => setIsReviewFormOpen(true)}
                              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 dark:bg-foreground text-white dark:text-background text-[10px] font-bold tracking-widest uppercase hover:bg-stone-700 dark:hover:bg-stone-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                              Write a Review
                            </button>
                          ) : (
                            <Link
                              to="/account/login"
                              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-300 dark:border-border text-[10px] font-bold tracking-widest uppercase text-stone-700 dark:text-foreground hover:border-stone-900 dark:hover:border-foreground hover:bg-stone-50 dark:hover:bg-muted transition-all duration-200"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                              Log In to Review
                            </Link>
                          )
                        }
                      </Await>
                    </Suspense>
                  ) : (
                    <button
                      type="button"
                      disabled={!shopifyProductId}
                      onClick={() => setIsReviewFormOpen(true)}
                      className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 dark:bg-foreground text-white dark:text-background text-[10px] font-bold tracking-widest uppercase hover:bg-stone-700 dark:hover:bg-stone-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                      Write a Review
                    </button>
                  )
                )}
              </div>

              {/* Rating summary card */}
              {hasRating && (() => {
                const reviewList = judgeMeReviews;
                const totalLocal = reviewList.length;
                return (
                  <div className="relative rounded-2xl overflow-hidden mb-8 bg-stone-50 border border-stone-200 dark:bg-stone-900 dark:border-stone-800 p-6 sm:p-7">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">

                      {/* Score + stars */}
                      <div className="flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-2 sm:border-r sm:border-stone-200 sm:dark:border-stone-700 sm:pr-8">
                        <span
                          className="text-6xl font-bold text-[#F14514] dark:text-[#F14514] leading-none"
                          style={{ fontFamily: "'Cormorant Variable', Georgia, serif" }}
                        >
                          {ratingLabel}
                        </span>
                        <div className="flex flex-col sm:items-start gap-1.5">
                          <div className="flex items-center gap-2">
                          <div className="flex gap-0.5" aria-hidden="true">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <svg key={s} className={`w-4 h-4 ${s <= Math.round(ratingValue) ? 'text-[#F14514]' : 'text-stone-300 dark:text-stone-700'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                              </svg>
                            ))}
                          </div>
                          <span className="h-4 w-px bg-stone-300 dark:bg-stone-700" aria-hidden="true" />
                          <p className="text-stone-400 dark:text-stone-500 text-[10px] tracking-widest uppercase">
                            {ratingCount} review{ratingCount !== 1 ? 's' : ''}
                          </p>
                          </div>
                        </div>
                      </div>

                      {/* Star breakdown bars */}
                      <div className="flex-1 w-full space-y-2.5">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = totalLocal > 0
                            ? reviewList.filter((r: any) => Math.round(r.rating) === stars).length
                            : 0;
                          const pct = totalLocal > 0 ? Math.round((count / totalLocal) * 100) : 0;
                          return (
                            <div key={stars} className="flex items-center gap-2.5">
                              <span className="text-stone-500 dark:text-stone-400 text-[11px] tabular-nums w-3 shrink-0 text-right">{stars}</span>
                              <svg className="w-3 h-3 text-[#F14514] shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                              </svg>
                              <div className="flex-1 h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#F14514] transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-stone-500 dark:text-stone-400 text-[11px] tabular-nums w-5 text-right shrink-0">
                                {count > 0 ? count : '–'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Review form */}
              {isReviewFormOpen && shopifyProductId && (
                <JudgeMeReviewForm
                  productId={shopifyProductId}
                  onClose={() => setIsReviewFormOpen(false)}
                />
              )}

              {/* Review list */}
              {judgeMeReviews.length > 0 ? (
                <JudgeMeReviews reviews={judgeMeReviews} />
              ) : (
                <div className="py-14 flex flex-col items-center text-center border border-dashed border-stone-200 dark:border-border rounded-2xl bg-stone-50/50 dark:bg-muted/20">
                  <div className="w-14 h-14 rounded-full bg-white dark:bg-card border border-stone-200 dark:border-border flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-stone-300 dark:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-stone-700 dark:text-foreground tracking-wide">No reviews yet</p>
                  <p className="text-xs text-stone-400 dark:text-muted-foreground mt-1.5 mb-5">Be the first to share your experience with this product</p>
                  {judgemeEnabled && shopifyProductId && (
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-300 dark:border-border text-[10px] font-bold tracking-widest uppercase text-stone-700 dark:text-foreground hover:bg-stone-900 hover:text-white hover:border-stone-900 dark:hover:bg-foreground dark:hover:text-background dark:hover:border-foreground transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                      Write the First Review
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── DEMO: How to Wear ── */}
            <div className="mt-14">
              <div className="mb-8">
                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-1.5">Guide</p>
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest">
                  How to Wear & Care
                </h3>
              </div>
              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-4.75 top-8 bottom-8 w-px bg-linear-to-b from-[#F14514]/40 via-[#F14514]/20 to-transparent dark:from-[#F14514]/40 dark:via-[#F14514]/15" />
                <div className="space-y-4">
                  {[
                    { step: '01', title: 'Cleanse before wearing', desc: 'Wash the rudraksha with clean water on a Monday morning before first use.' },
                    { step: '02', title: 'Wear on the right wrist or neck', desc: 'For maximum benefit, wear touching the skin. Avoid synthetic clothing contact.' },
                    { step: '03', title: 'Monthly oil treatment', desc: 'Apply a drop of sandalwood or sesame oil monthly to keep the surface nourished.' },
                    { step: '04', title: 'Remove during sleep & bathing', desc: 'Take off during bathing and sleep to extend the life of the thread and bead.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-5 items-start group hover:-translate-y-0.5 transition-all duration-300">
                      {/* Step circle */}
                      <div className="relative z-10 w-10 h-10 rounded-full bg-white dark:bg-card border-2 border-[#F14514] dark:border-[#F14514] flex items-center justify-center shrink-0 group-hover:border-[#F14514] transition-all duration-300">
                        <span className="text-[11px] font-bold text-[#F14514] dark:text-[#F14514] tracking-wide">
                          {item.step}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-card border border-stone-200/60 dark:border-border rounded-2xl p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex-1 transition-all duration-300">
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
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest">
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

      {/* ── Share Modal (animated bottom-sheet on mobile, centred panel on desktop) ── */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Share product"
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${shareIn ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeShare}
          />

          {/* Panel */}
          <div
            className={`
              relative z-10 w-full sm:max-w-sm
              bg-white
              rounded-t-3xl sm:rounded-2xl
              shadow-2xl
              transition-all duration-300 ease-out
              ${shareIn
                ? 'translate-y-0 sm:scale-100 opacity-100'
                : 'translate-y-full sm:translate-y-0 sm:scale-95 opacity-0'
              }
            `}
          >
            {/* Handle (mobile only) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-stone-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:pt-5 border-b border-stone-100">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-bold mb-0.5">Share</p>
                <h2 className="text-sm font-semibold text-stone-900 leading-snug max-w-[220px] truncate">{title}</h2>
              </div>
              <button
                type="button"
                onClick={closeShare}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors shrink-0 ml-3"
                aria-label="Close share sheet"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Share content */}
            <div className="px-5 pt-4 pb-6">
              <ProductShare title={title} />
            </div>
          </div>
        </div>
      )}

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
          id: product.id,
          title: product.title,
          featuredImage: images[0] ?? null,
          variants: (product as any).variants?.nodes ?? [],
        }}
        triggerRef={productFormRef}
        onAddToCartClick={() => {}}
      />
    </div>
  );
}


function CouponCard({ code, label, offer }: { code: string; label?: string; offer?: string }) {
  return (
    <div className="mx-5 mb-3">
      <div className="relative rounded-xl bg-black">

        {/* Fire crackers video */}
        <video
          src="/videos/fire crackers.webm"
          autoPlay loop muted playsInline aria-hidden="true"
          className="absolute top-0 right-0 w-[55%] h-full object-cover object-center pointer-events-none z-0"
        />

        {/* Notches */}
        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white z-10" />
        <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white z-10" />

        {/* Festival Offer badge */}
        <span className="absolute right-0 top-0 z-[2] text-[9px] tracking-[0.14em] uppercase bg-linear-to-br from-[#f14514] to-[#d4370d] text-white rounded-bl-lg rounded-tr-xl px-2 py-0.5">
          ✦ Festival Offer ✦
        </span>

        {/* Content */}
        <div className="relative z-[1] flex items-stretch">
          {/* Icon */}
          <div className="flex items-center px-4 sm:px-5 py-4 sm:py-5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
          </div>

          {/* Full-height dashed vertical divider */}
          <div className="self-stretch w-0 border-l border-dashed border-white" />

          {/* Text */}
          <div className="flex-1 px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-1.5 sm:gap-2 min-w-0">
            <p className="coupon-label-animated text-xs sm:text-sm lg:text-base font-semibold leading-tight">
              {label || 'Use this code in your bag'}
            </p>
            {offer && (
              <p className="text-[10px] sm:text-xs lg:text-sm text-white/80 leading-tight">{offer}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="font-mono text-xs sm:text-sm lg:text-base font-medium tracking-widest text-white bg-black/60 px-2 py-0.5 rounded-md border border-dashed border-white/70">
                {code}
              </span>
              <span className="text-[12px] sm:text-sm lg:text-base text-white leading-none">&#x21d2; open bag &#x21d2; tap Apply</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recommended Products ─────────────────────────────────────────────────────

function RecommendedProducts({ products }: { products: any[] }) {
  const displayProducts = products?.slice(0, 4) ?? [];

  if (displayProducts.length === 0) return null;

  return (
    <section className="mt-10 md:mt-16 pt-12 md:pt-16 pb-10 md:pb-14 relative">
      <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
        <img src="/line-art.png" alt="" className="w-auto h-auto max-w-full pointer-events-none dark:brightness-0 dark:invert" />
      </div>

      <div className="text-center mb-8 md:mb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-3">
          Handpicked For You
        </p>
        <h2
          className="text-3xl md:text-4xl font-light text-stone-900 dark:text-foreground font-heading"
        >
          You May Also Like
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {displayProducts.map((product: any, index: number) => (
          <div
            key={product.id}
            className="group bg-[#f6f6f6] dark:bg-muted border border-transparent dark:border-border rounded-[24px] p-2 sm:p-2.5 flex flex-col transition-all h-full"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden rounded-3xl mb-2 sm:mb-3 bg-transparent shrink-0">
              <Link to={`/products/${product.handle}`} prefetch="intent" className="block w-full h-full">
                {product.featuredImage ? (
                  <Image
                    data={product.featuredImage}
                    className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                    loading={index < 2 ? 'eager' : 'lazy'}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-transparent">
                    <span className="text-5xl opacity-20 text-gray-400">✦</span>
                  </div>
                )}
              </Link>
            </div>

            {/* Detail card */}
            <div className="bg-white dark:bg-card rounded-3xl p-3 sm:p-4 flex flex-col flex-1 gap-2 border border-black/10 dark:border-border/40 relative z-10">
              <Link to={`/products/${product.handle}`} prefetch="intent" className="block">
                <h3 className="text-sm sm:text-lg leading-tight line-clamp-1 text-black dark:text-foreground">
                  {product.title}
                </h3>
              </Link>

              <div className="flex items-center gap-2">
                <Money
                  withoutTrailingZeros
                  data={product.priceRange.minVariantPrice}
                  className="text-[16px] sm:text-[22px] border-none shadow-none font-medium text-black dark:text-foreground leading-none"
                />
              </div>

              <div className="mt-auto pt-2">
                <CartForm
                  route="/cart"
                  inputs={{
                    lines: [{ merchandiseId: product.variants?.nodes?.[0]?.id, quantity: 1 }],
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
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-card border border-gray-800 dark:border-border text-gray-800 dark:text-foreground text-xs sm:text-base rounded-full group-hover:bg-black/90 dark:group-hover:bg-foreground group-hover:text-white dark:group-hover:text-background disabled:cursor-not-allowed cursor-pointer transition-all duration-300 ease-in-out"
      aria-label="Add to bag"
    >
      <img src="/icons/add-bag.png" alt="" className="w-4 h-4 md:w-6 md:h-6 shrink-0 dark:invert dark:brightness-0 group-hover:invert group-hover:brightness-0 transition-all" />
      {availableForSale ? 'Add to Bag' : 'Sold Out'}
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
    coupon_code: metafield(namespace: "custom", key: "coupon_code") {
      value
    }
    coupon_label: metafield(namespace: "custom", key: "coupon_label") {
      value
    }
    coupon_offer: metafield(namespace: "custom", key: "coupon_offer") {
      value
    }
    product_features: metafield(namespace: "custom", key: "product_features") {
      value
      type
    }
    shipping_returns: metafield(namespace: "custom", key: "shipping_returns") {
      value
      type
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
