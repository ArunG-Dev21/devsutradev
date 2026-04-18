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
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  const origin = new URL(args.request.url).origin;
  return { ...deferredData, ...criticalData, seoOrigin: origin };
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
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;
  const collectionHandle = getCollectionHandleFromArticle({
    blogHandle,
    title: article.title,
    contentHtml: article.contentHtml,
  });

  let relatedProducts: any[] = [];

  try {
    const { collection } = await context.storefront.query(SIDEBAR_PRODUCTS_QUERY, {
      variables: { handle: collectionHandle, first: 6 },
    });
    relatedProducts = collection?.products?.nodes ?? [];
  } catch {
    // Leave related products empty when the collection query fails.
  }

  return { article, blogHandle, blogTitle: blog.title, relatedProducts };
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

function getCollectionHandleFromArticle(params: {
  blogHandle: string;
  title: string;
  contentHtml: string;
}) {
  const haystack =
    `${params.blogHandle} ${params.title} ${params.contentHtml}`.toLowerCase();

  if (haystack.includes('rudraksha')) return 'rudraksha';
  return 'all';
}

function getCollectionLinkFromArticle(params: {
  blogHandle: string;
  title: string;
  contentHtml: string;
}) {
  const handle = getCollectionHandleFromArticle(params);

  if (handle === 'rudraksha') {
    return { href: '/collections/rudraksha', label: 'Shop Rudraksha Collection' };
  }

  return { href: '/collections/all', label: 'Explore Products' };
}

function estimateReadingTime(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function getMeaningfulExcerpt(title: string, excerpt?: string | null) {
  if (!excerpt) return null;

  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const normalizedTitle = normalize(title);
  const normalizedExcerpt = normalize(excerpt);

  if (!normalizedExcerpt || normalizedExcerpt === normalizedTitle) {
    return null;
  }

  return excerpt;
}

function ProductCard({ product }: { product: any }) {
  return (
    <Link
      to={`/products/${product.handle}`}
      className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-background p-3 transition-colors hover:border-foreground/20 hover:bg-accent/20"
      prefetch="intent"
    >
      {product.featuredImage ? (
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image
            data={product.featuredImage}
            aspectRatio="1/1"
            sizes="80px"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-medium leading-6 text-foreground">
          {product.title}
        </h3>
        <div className="mt-2 text-sm text-muted-foreground">
          <Money data={product.priceRange.minVariantPrice} />
        </div>
      </div>
    </Link>
  );
}

export default function Article() {
  const { article, blogHandle, blogTitle, relatedProducts, seoOrigin } =
    useLoaderData<typeof loader>();
  const { title, image, contentHtml, author, tags, excerpt } = article;
  const meaningfulExcerpt = getMeaningfulExcerpt(title, excerpt);
  const collectionLink = getCollectionLinkFromArticle({
    blogHandle,
    title,
    contentHtml,
  });
  const readingTime = estimateReadingTime(contentHtml);
  const publishedDate = formatDate(article.publishedAt);

  const articleRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const el = articleRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight;
      const scrolled = Math.max(0, -rect.top);
      const nextProgress =
        total > window.innerHeight
          ? Math.min(100, (scrolled / (total - window.innerHeight)) * 100)
          : 0;

      setProgress(nextProgress);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            articleSchema(article as any, blogHandle, article.handle, seoOrigin),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', url: `${seoOrigin}/` },
              { name: 'Blog', url: `${seoOrigin}/blogs` },
              {
                name: blogTitle || blogHandle,
                url: `${seoOrigin}/blogs/${blogHandle}`,
              },
              {
                name: title,
                url: `${seoOrigin}/blogs/${blogHandle}/${article.handle}`,
              },
            ]),
          ),
        }}
      />

      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-transparent" aria-hidden>
        <div
          className="h-full bg-foreground transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <section className="border-b border-border/70 bg-muted/20">
        <RouteBreadcrumbBanner variant="light" />
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-5">
            <div className="w-full lg:w-1/2">
              {tags && tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/70 bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <h1 className="mt-6 max-w-2xl font-heading text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-[3.65rem]">
                {title}
              </h1>

              {meaningfulExcerpt ? (
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                  {meaningfulExcerpt}
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
                <span className="font-medium uppercase tracking-[0.08em] text-foreground">
                  {author?.name || 'Devasutra'}
                </span>
                <span>{publishedDate}</span>
                <span>{readingTime} min read</span>
              </div>
            </div>

            {image ? (
              <div className="w-full lg:w-1/2 lg:pt-2">
                <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_20px_60px_-42px_rgba(0,0,0,0.28)]">
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image
                      data={image}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      loading="eager"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
          <article ref={articleRef} className="min-w-0 max-w-[820px]">
            <div
              dangerouslySetInnerHTML={{ __html: cleanShopifyHtml(sanitizeHtml(contentHtml)) }}
              className="
                prose prose-stone max-w-none
                text-[1.06rem] leading-[1.85] text-foreground/90
                md:text-[1.1rem]

                prose-headings:font-heading prose-headings:text-foreground prose-headings:tracking-tight
                prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-[1.85rem] prose-h2:font-normal prose-h2:leading-tight
                prose-h3:mt-9 prose-h3:mb-3 prose-h3:text-[1.45rem] prose-h3:font-normal prose-h3:leading-snug
                prose-h4:mt-7 prose-h4:mb-2 prose-h4:text-[1.15rem] prose-h4:font-medium

                prose-p:my-0 prose-p:text-[1.06rem] prose-p:leading-[1.85] prose-p:text-foreground/90
                md:prose-p:text-[1.1rem]

                prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 prose-a:decoration-foreground/30
                prose-strong:font-semibold prose-strong:text-foreground

                prose-ul:my-5 prose-ul:pl-5
                prose-ol:my-5 prose-ol:pl-5
                prose-li:my-1 prose-li:text-foreground/90

                prose-blockquote:my-8 prose-blockquote:border-l-2 prose-blockquote:border-foreground/20
                prose-blockquote:pl-5 prose-blockquote:text-foreground/75

                prose-hr:my-10 prose-hr:border-border

                prose-img:my-8 prose-img:max-h-[480px] prose-img:w-full prose-img:rounded-2xl
                prose-img:border prose-img:border-border/70 prose-img:object-cover
                prose-figcaption:mt-2 prose-figcaption:text-sm prose-figcaption:text-center prose-figcaption:text-muted-foreground

                prose-table:block prose-table:w-full prose-table:overflow-x-auto
                prose-th:border prose-th:border-border prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2
                prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2

                [&_p+p]:mt-5
                [&_p:empty]:hidden

                [&>p:first-of-type]:text-[1.15rem] [&>p:first-of-type]:leading-[1.78] [&>p:first-of-type]:text-foreground/80
                md:[&>p:first-of-type]:text-[1.2rem]
              "
            />

            {tags && tags.length > 0 ? (
              <div className="mt-12 border-t border-border/70 pt-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Tags
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-12 rounded-[24px] border border-border/70 bg-muted/20 p-6 sm:p-8 xl:hidden">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Discover our collection
              </p>
              <h2 className="mt-3 font-heading text-2xl text-foreground">
                Explore Sacred Products
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Hand-picked, blessed, and chosen for a more intentional spiritual practice.
              </p>
              <Link
                to={collectionLink.href}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85"
              >
                {collectionLink.label}
              </Link>
            </div>

            <div className="mt-12 border-t border-border/70 pt-8">
              <Link
                to={`/blogs/${blogHandle}`}
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:text-muted-foreground"
              >
                <span>{'<-'}</span>
                <span>Back to {blogTitle || 'Blog'}</span>
              </Link>
            </div>
          </article>

          <aside className="hidden xl:block">
            <div className="sticky top-28 rounded-[24px] border border-border/70 bg-muted/20 p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Related products
              </p>

              {relatedProducts.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {relatedProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-border/70 bg-background p-5">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Explore the collection connected to this article for pieces chosen to match the same intention and practice.
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-border/70 pt-6">
                <Link
                  to={collectionLink.href}
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85"
                >
                  {collectionLink.label}
                </Link>
              </div>
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
      handle
      title
      articleByHandle(handle: $articleHandle) {
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
