import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blogs.$blogHandle.$articleHandle';
import { Image, Money } from '@shopify/hydrogen';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { useEffect, useRef, useState } from 'react';
import {
  generateMeta,
  truncate,
  stripHtml,
  articleSchema,
  breadcrumbSchema,
  jsonLd,
} from '~/lib/seo';

export const meta: Route.MetaFunction = ({ data }) => {
  const article = (data as any)?.article;
  const origin = (data as any)?.seoOrigin || '';
  const blogHandle = (data as any)?.blogHandle || '';
  const title = `${article?.title ?? ''} | Devasutra Blog`;
  const description = article?.seo?.description
    || (article?.excerpt ? truncate(stripHtml(article.excerpt), 155) : '')
    || truncate(stripHtml(article?.contentHtml || ''), 155);
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

  // Determine which collection to fetch related products from
  const collectionHandle = getCollectionHandleFromArticle({
    blogHandle,
    title: article.title,
    contentHtml: article.contentHtml,
  });

  let relatedProducts: any[] = [];
  try {
    const { collection } = await context.storefront.query(
      SIDEBAR_PRODUCTS_QUERY,
      { variables: { handle: collectionHandle, first: 6 } },
    );
    relatedProducts = collection?.products?.nodes ?? [];
  } catch {
    // Fallback: no products in sidebar
  }

  return { article, blogHandle, blogTitle: blog.title, relatedProducts };
}

function loadDeferredData({ context }: Route.LoaderArgs) {
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
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function Article() {
  const { article, blogHandle, blogTitle, relatedProducts } =
    useLoaderData<typeof loader>();
  const seoOrigin = ((useLoaderData<typeof loader>()) as any).seoOrigin || '';
  const { title, image, contentHtml, author, tags, excerpt } = article;
  const collectionLink = getCollectionLinkFromArticle({
    blogHandle,
    title,
    contentHtml,
  });

  const readingTime = estimateReadingTime(contentHtml);

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  // Reading progress bar
  const articleRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight;
      const scrolled = Math.max(0, -rect.top);
      setProgress(
        Math.min(100, (scrolled / (total - window.innerHeight)) * 100),
      );
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="article-page">
      {/* Article JSON-LD */}
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
              { name: blogTitle || blogHandle, url: `${seoOrigin}/blogs/${blogHandle}` },
              { name: title, url: `${seoOrigin}/blogs/${blogHandle}/${article.handle}` },
            ]),
          ),
        }}
      />
      {/* Reading progress bar */}
      <div className="article-progress-bar" aria-hidden>
        <div
          className="article-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hero image — full width */}
      {image && (
        <div className="article-hero">
          <div className="article-hero-image">
            <Image data={image} sizes="100vw" loading="eager" />
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="article-layout">
        {/* Main content column */}
        <article className="article-main" ref={articleRef}>
          {/* Breadcrumb */}
          <nav className="article-breadcrumb" aria-label="Breadcrumb">
            <Link to="/blogs" className="article-breadcrumb-link">
              Blog
            </Link>
            <span className="article-breadcrumb-sep">/</span>
            <Link
              to={`/blogs/${blogHandle}`}
              className="article-breadcrumb-link"
            >
              {blogTitle || blogHandle}
            </Link>
          </nav>

          {/* Header */}
          <header className="article-header">
            {tags && tags.length > 0 && (
              <div className="article-tags">
                {tags.map((tag: string) => (
                  <span key={tag} className="article-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="article-title">{title}</h1>

            {excerpt && <p className="article-excerpt">{excerpt}</p>}

            <div className="article-byline">
              <div className="article-author-avatar" aria-hidden>
                {author?.name ? author.name.charAt(0).toUpperCase() : 'D'}
              </div>
              <div className="article-byline-text">
                <span className="article-author-name">
                  {author?.name || 'Devasutra'}
                </span>
                <div className="article-byline-meta">
                  <time dateTime={article.publishedAt}>{publishedDate}</time>
                  <span className="article-byline-dot">&middot;</span>
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>
          </header>

          <hr className="article-divider" />

          {/* Body */}
          <div
            dangerouslySetInnerHTML={{ __html: contentHtml }}
            className="article-body"
          />

          {/* Tags footer */}
          {tags && tags.length > 0 && (
            <div className="article-tags-footer">
              {tags.map((tag: string) => (
                <span key={tag} className="article-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA Card — only on mobile (sidebar handles desktop) */}
          <div className="article-cta-card article-cta-mobile-only">
            <div className="article-cta-inner">
              <p className="article-cta-label">Discover our collection</p>
              <h3 className="article-cta-heading">Explore Sacred Products</h3>
              <p className="article-cta-desc">
                Hand-picked, blessed &amp; certified — crafted with intention
                for your spiritual journey.
              </p>
              <Link to={collectionLink.href} className="article-cta-button">
                {collectionLink.label}
              </Link>
            </div>
          </div>

          {/* Footer nav */}
          <div className="article-footer-nav">
            <Link
              to={`/blogs/${blogHandle}`}
              className="article-footer-back"
            >
              ← Back to {blogTitle || 'Blog'}
            </Link>
          </div>
        </article>

        {/* Sidebar — related products */}
        <aside className="article-sidebar">
          <div className="article-sidebar-sticky">
            <div className="article-sidebar-header">
              <span className="article-sidebar-label">Related Products</span>
              <Link
                to={collectionLink.href}
                className="article-sidebar-view-all"
              >
                View all
              </Link>
            </div>
            <div className="article-sidebar-products">
              {relatedProducts.map((product: any) => (
                <Link
                  key={product.id}
                  to={`/products/${product.handle}`}
                  className="sidebar-product-card"
                  prefetch="intent"
                >
                  {product.featuredImage && (
                    <div className="sidebar-product-image">
                      <Image
                        data={product.featuredImage}
                        aspectRatio="1/1"
                        sizes="160px"
                      />
                    </div>
                  )}
                  <div className="sidebar-product-info">
                    <h4 className="sidebar-product-title">{product.title}</h4>
                    <div className="sidebar-product-price">
                      <Money data={product.priceRange.minVariantPrice} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {relatedProducts.length > 0 && (
              <Link
                to={collectionLink.href}
                className="article-sidebar-cta"
              >
                {collectionLink.label}
              </Link>
            )}
          </div>
        </aside>
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
