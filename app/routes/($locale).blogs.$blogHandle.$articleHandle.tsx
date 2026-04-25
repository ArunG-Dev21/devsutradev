import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blogs.$blogHandle.$articleHandle';
import { Image, Money } from '@shopify/hydrogen';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { useEffect, useRef, useState } from 'react';
import {
  articleSchema,
  breadcrumbSchema,
  generateMeta,
  jsonLd,
  stripHtml,
  truncate,
} from '~/lib/seo';
import { sanitizeHtml, cleanShopifyHtml } from '~/lib/sanitizer';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';
import { ProductShare } from '~/features/product/components/ProductShare';
import { WishlistHeart } from '~/shared/components/WishlistHeart';

export const meta: Route.MetaFunction = ({ data }) => {
  const article = (data as any)?.article;
  const origin = (data as any)?.seoOrigin || '';
  const blogHandle = (data as any)?.blogHandle || '';
  const title = `${article?.title ?? ''} | Devasutra Blog`;
  const description =
    article?.seo?.description ||
    (article?.excerpt ? truncate(stripHtml(article.excerpt), 155) : '') ||
    truncate(stripHtml(article?.contentHtml || ''), 155);
  const ogImage = article?.image?.url || '';

  return generateMeta({
    title,
    description,
    canonical: `${origin}/blogs/${blogHandle}/${article?.handle || ''}`,
    ogType: 'article',
    ogImage,
  });
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  const origin = new URL(args.request.url).origin;
  return { ...criticalData, seoOrigin: origin };
}

async function loadCriticalData({ context, request, params }: Route.LoaderArgs) {
  const { blogHandle, articleHandle } = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', { status: 404 });
  }

  const [{ blog }] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: { blogHandle, articleHandle },
    }),
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, { status: 404 });
  }

  redirectIfHandleIsLocalized(
    request,
    { handle: articleHandle, data: blog.articleByHandle },
    { handle: blogHandle, data: blog },
  );

  const article = blog.articleByHandle;
  const collectionHandle = getCollectionHandle(blogHandle, article.title, article.contentHtml);

  let relatedProducts: any[] = [];
  try {
    const { collection } = await context.storefront.query(SIDEBAR_PRODUCTS_QUERY, {
      variables: { handle: collectionHandle, first: 6 },
    });
    relatedProducts = collection?.products?.nodes ?? [];
  } catch {
    // silently ignore
  }

  return { article, blogHandle, blogTitle: blog.title, relatedProducts };
}

const COLLECTION_MAP: Record<string, { href: string; label: string; keyword: string }> = {
  rudraksha: { href: '/collections/rudraksha', label: 'Shop Rudraksha', keyword: 'rudraksha' },
  karungali: { href: '/collections/karungali', label: 'Shop Karungali', keyword: 'karungali' },
  bracelets: { href: '/collections/bracelets', label: 'Shop Bracelets', keyword: 'bracelet' },
};

function getCollectionHandle(blogHandle: string, title: string, contentHtml: string) {
  const haystack = `${blogHandle} ${title} ${contentHtml}`.toLowerCase();
  for (const [handle, { keyword }] of Object.entries(COLLECTION_MAP)) {
    if (haystack.includes(keyword)) return handle;
  }
  return 'all';
}

function getCollectionLink(blogHandle: string, title: string, contentHtml: string) {
  const handle = getCollectionHandle(blogHandle, title, contentHtml);
  return COLLECTION_MAP[handle] ?? { href: '/collections/all', label: 'Explore All Products' };
}

function estimateReadingTime(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

/* ──────────── Sidebar product card ──────────── */
function SidebarProductCard({ product }: { product: any }) {
  return (
    <Link
      to={`/products/${product.handle}`}
      prefetch="intent"
      className="group/card block rounded-2xl overflow-hidden bg-card ring-1 ring-border/50 hover:-translate-y-0.5 transition-all duration-300 ease-out no-underline"
    >
      {/* Image area */}
      <div className="relative aspect-square bg-muted overflow-hidden m-2 rounded-xl">
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            aspectRatio="1/1"
            sizes="(min-width: 1280px) 224px, 40vw"
            className="w-full h-full object-cover rounded-xl transition-transform duration-500 ease-out group-hover/card:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-amber-50 via-orange-50 to-orange-100 dark:from-neutral-800 dark:via-neutral-750 dark:to-neutral-700" />
        )}
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-linear-to-t from-background/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-2 z-10">
          <WishlistHeart
            productId={product.id}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm hover:bg-white"
            size={16}
          />
        </div>
      </div>

      {/* Info strip */}
      <div className="relative px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-medium text-foreground line-clamp-1 leading-snug">
            {product.title}
          </p>
          <Money
            data={product.priceRange.minVariantPrice}
            className="text-base sm:text-lg font-medium text-foreground mt-0.5 leading-none block font-montserrat"
          />
        </div>
        <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-foreground text-background rotate-[-35deg] transition-transform duration-300 ease-out">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

/* ──────────── Page ──────────── */
export default function Article() {
  const { article, blogHandle, blogTitle, relatedProducts, seoOrigin } =
    useLoaderData<typeof loader>();
  const { title, image, contentHtml, author, tags } = article;
  const collectionLink = getCollectionLink(blogHandle, title, contentHtml);
  const readingTime = estimateReadingTime(contentHtml);

  const articleRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    let rafId = 0;
    let lastProgress = -1;

    function compute() {
      rafId = 0;
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      const total = el.scrollHeight;
      const next =
        total > window.innerHeight
          ? Math.min(100, (scrolled / (total - window.innerHeight)) * 100)
          : 0;
      // Only re-render when the rounded progress actually moves a percent.
      const rounded = Math.round(next);
      if (rounded !== lastProgress) {
        lastProgress = rounded;
        setProgress(rounded);
      }
    }
    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(compute);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(articleSchema(article as any, blogHandle, article.handle, seoOrigin)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', url: `${seoOrigin}/` },
              { name: 'Blog', url: `${seoOrigin}/blogs` },
              { name: blogTitle || blogHandle, url: `${seoOrigin}/blogs/${blogHandle}` },
              { name: title, url: `${seoOrigin}/blogs/${blogHandle}/${article.handle}` },
            ]),
          ),
        }}
      />

      {/* Reading progress */}
      <div className="fixed inset-x-0 top-0 z-50 h-[3px]" aria-hidden>
        <div className="h-full bg-foreground transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>

      <RouteBreadcrumbBanner variant="light" className="bg-transparent! border-b border-border/30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* ── Article ── */}
          <div className="min-w-0 flex-1 max-w-6xl">
            {/* Back link + Share */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <Link
                to={`/blogs/${blogHandle}`}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                {blogTitle || 'Blog'}
              </Link>
              <button
                type="button"
                onClick={openShare}
                className="w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50 transition-all duration-200 shrink-0"
                aria-label="Share this article"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
              </button>
            </div>

            {/* Tags */}
            {tags && tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Title */}
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-[2.5rem]">
              {title}
            </h1>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-200 pb-6 text-sm text-gray-400">
              {author?.name ? <span className="font-medium text-gray-600">{author.name}</span> : null}
              <span>{formatDate(article.publishedAt)}</span>
              <span>{readingTime} min read</span>
            </div>

            {/* Hero image */}
            {image ? (
              <div className="mt-6 overflow-hidden rounded-2xl bg-gray-100">
                <Image
                  data={image}
                  sizes="(min-width: 1280px) 70vw, 100vw"
                  loading="eager"
                  className="aspect-16/8 w-full object-cover"
                />
              </div>
            ) : null}

            {/* Article body */}
            <article ref={articleRef}>
              <div
                dangerouslySetInnerHTML={{ __html: cleanShopifyHtml(sanitizeHtml(contentHtml)) }}
                className="article-body mt-8"
              />

              {/* Tags at bottom */}
              {tags && tags.length > 0 ? (
                <div className="mt-10 border-t border-gray-200 pt-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Mobile product cards */}
              {relatedProducts.length > 0 ? (
                <div className="mt-10 border-t border-gray-200 pt-8 lg:hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold uppercase text-gray-900">You might also like</h3>
                    <Link
                      to={collectionLink.href}
                      className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {relatedProducts.slice(0, 6).map((p: any) => (
                      <SidebarProductCard key={p.id} product={p} />
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Link
                      to={collectionLink.href}
                      className="inline-flex items-center justify-center rounded-full border border-foreground px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                    >
                      {collectionLink.label}
                    </Link>
                  </div>
                </div>
              ) : null}

            </article>
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-56 xl:w-72 shrink-0 sticky top-28 self-start">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                <h2 className="text-sm font-semibold text-foreground tracking-wide">
                  Related Products
                </h2>
                <Link
                  to={collectionLink.href}
                  className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all
                </Link>
              </div>

              {relatedProducts.length > 0 ? (
                <div className="space-y-3">
                  {relatedProducts.slice(0, 5).map((product: any) => (
                    <SidebarProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No related products found.
                </p>
              )}

              <Link
                to={collectionLink.href}
                className="mt-4 flex items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-80"
              >
                {collectionLink.label}
              </Link>
            </div>
          </aside>

        </div>
      </div>

      {/* ── Share Modal (animated bottom-sheet on mobile, centred panel on desktop) ── */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Share article"
        >
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${shareIn ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeShare}
          />
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
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-stone-200" />
            </div>
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
            <div className="px-5 pt-4 pb-6">
              <ProductShare title={title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      id
      handle
      title
      articleByHandle(handle: $articleHandle) {
        id
        handle
        title
        contentHtml
        publishedAt
        excerpt
        tags
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;

const SIDEBAR_PRODUCTS_QUERY = `#graphql
  query SidebarProducts(
    $handle: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first, sortKey: BEST_SELLING) {
        nodes {
          id
          handle
          title
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
        }
      }
    }
  }
` as const;
