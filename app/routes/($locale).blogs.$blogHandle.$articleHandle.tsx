import { Link, useLoaderData, useFetcher } from 'react-router';
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

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const articleId = String(form.get('articleId') ?? '').trim();
  const blogId = String(form.get('blogId') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const body = String(form.get('body') ?? '').trim();

  if (!name || !email || !body || !articleId || !blogId) {
    return { error: 'All fields are required.' };
  }

  const adminToken = (context.env as any).SHOPIFY_ADMIN_API_ACCESS_TOKEN as string | undefined;
  if (!adminToken) {
    return { error: 'Comment submission is not configured.' };
  }

  // GIDs are like gid://shopify/Article/123456 — extract the numeric portion
  const numericArticleId = articleId.split('/').pop();
  const numericBlogId = blogId.split('/').pop();

  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  const res = await fetch(
    `https://${shopDomain}/admin/api/2024-10/comments.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({
        comment: {
          body,
          author: name,
          email,
          article_id: numericArticleId,
          blog_id: numericBlogId,
        },
      }),
    },
  );

  if (res.status === 201) return { ok: true };

  const json = await res.json().catch(() => ({}));
  const msg = (json as any)?.errors?.base?.[0] ?? 'Failed to submit comment.';
  return { error: msg };
}

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

  return { article, blogHandle, blogTitle: blog.title, blogId: blog.id, relatedProducts };
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
      className="group block rounded-2xl bg-muted/60 p-2 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="aspect-square overflow-hidden rounded-xl bg-background">
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            aspectRatio="1/1"
            sizes="(min-width: 1280px) 180px, 40vw"
            className="h-full w-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl opacity-20 text-gray-300">✦</span>
          </div>
        )}
      </div>
      <div className="mt-1.5 rounded-xl border border-border/50 bg-card p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {product.title}
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <Money
            data={product.priceRange.minVariantPrice}
            className="text-sm font-semibold text-foreground font-montserrat"
          />
          <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-foreground">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ──────────── Comment form ──────────── */
function CommentForm({ articleId, blogId }: { articleId: string; blogId: string }) {
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const result = fetcher.data;

  if (result?.ok) {
    return (
      <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">
        <svg className="mx-auto mb-3 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        <p className="font-medium text-gray-900">Comment submitted!</p>
        <p className="mt-1 text-sm text-gray-500">It will appear after review.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-gray-200 pt-10">
      <h2 className="text-xl font-semibold text-gray-900">Leave a comment</h2>
      <fetcher.Form method="post" className="mt-6 space-y-4">
        <input type="hidden" name="articleId" value={articleId} />
        <input type="hidden" name="blogId" value={blogId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="comment-name" className="block text-xs font-medium uppercase tracking-[0.16em] text-gray-500 mb-1.5">
              Name *
            </label>
            <input
              id="comment-name"
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="comment-email" className="block text-xs font-medium uppercase tracking-[0.16em] text-gray-500 mb-1.5">
              Email *
            </label>
            <input
              id="comment-email"
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="comment-body" className="block text-xs font-medium uppercase tracking-[0.16em] text-gray-500 mb-1.5">
            Comment *
          </label>
          <textarea
            id="comment-body"
            name="body"
            required
            rows={4}
            placeholder="Share your thoughts…"
            className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
          />
        </div>
        {result?.error ? (
          <p className="text-sm text-red-500">{result.error}</p>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400">Comments are moderated.</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-foreground px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Post comment'}
          </button>
        </div>
      </fetcher.Form>
    </div>
  );
}

/* ──────────── Page ──────────── */
export default function Article() {
  const { article, blogHandle, blogTitle, blogId, relatedProducts, seoOrigin } =
    useLoaderData<typeof loader>();
  const { title, image, contentHtml, author, tags } = article;
  const collectionLink = getCollectionLink(blogHandle, title, contentHtml);
  const readingTime = estimateReadingTime(contentHtml);

  const articleRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

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
            {/* Back link */}
            <Link
              to={`/blogs/${blogHandle}`}
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {blogTitle || 'Blog'}
            </Link>

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
                    <h3 className="text-base font-semibold text-gray-900">You might also like</h3>
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

              {/* Comment form */}
              <CommentForm articleId={article.id} blogId={blogId} />
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
