import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blogs._index';
import { getPaginationVariables, Image } from '@shopify/hydrogen';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { sanitizeHtml } from '~/lib/sanitizer';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Blog — Sacred Wisdom & Guides | Devasutra' },
    { name: 'description', content: 'Explore insights, guides, and wisdom from the world of sacred traditions. Learn about Rudraksha, Karungali, gemstones, and spiritual practices.' },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return { ...deferredData, ...criticalData };
}

async function loadCriticalData({ context, request }: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const [{ blogs }] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    }),
  ]);

  return { blogs };
}

function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

interface BlogNode {
  title: string;
  handle: string;
  seo?: { title?: string | null; description?: string | null } | null;
  articles: {
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      publishedAt: string;
      image?: { id?: string | null; altText?: string | null; url: string; width?: number | null; height?: number | null } | null;
      excerpt?: string | null;
      blog: { handle: string };
    }>;
  };
}

function getCollectionHrefFromHandle(handle: string) {
  return handle.toLowerCase().includes('rudraksha')
    ? '/collections/rudraksha'
    : '/collections/all';
}

export default function Blogs() {
  const { blogs } = useLoaderData<typeof loader>();

  return (
    <div className="blog-index-page">
      {/* Hero Header */}
      <div className="blog-hero">
        <div className="blog-hero-content">
          <h1 className="blog-hero-title text-heading">Our Blog</h1>
          <p className="blog-hero-subtitle">
            Insights, stories, and wisdom from the world of sacred traditions
          </p>
          <div className="mt-6">
            <Link
              to="/collections/rudraksha"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-border text-[11px] tracking-[0.18em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Shop Rudraksha Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Blog Sections */}
      <div className="blog-index-container">
        <PaginatedResourceSection<BlogNode> connection={blogs}>
          {({ node: blog }) => (
            <div key={blog.handle} className="blog-section">
              <div className="blog-section-header">
                <h2 className="blog-section-title">{blog.title}</h2>
                <div className="flex items-center gap-4">
                  <Link
                    to={getCollectionHrefFromHandle(blog.handle)}
                    className="blog-section-link"
                    prefetch="intent"
                  >
                    Shop products →
                  </Link>
                  <Link
                    to={`/blogs/${blog.handle}`}
                    className="blog-section-link"
                    prefetch="intent"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              {blog.articles.nodes.length > 0 ? (
                <div className="blog-articles-grid">
                  {blog.articles.nodes.map((article, index) => {
                    const publishedAt = new Intl.DateTimeFormat('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }).format(new Date(article.publishedAt));

                    return (
                      <Link
                        key={article.id}
                        to={`/blogs/${article.blog.handle}/${article.handle}`}
                        className={`blog-card ${index === 0 ? 'blog-card-featured' : ''}`}
                        prefetch="intent"
                      >
                        {article.image && (
                          <div className="blog-card-image">
                            <Image
                              alt={article.image.altText || article.title}
                              data={article.image}
                              sizes={index === 0 ? '(min-width: 768px) 60vw, 100vw' : '(min-width: 768px) 30vw, 100vw'}
                              loading={index < 2 ? 'eager' : 'lazy'}
                            />
                          </div>
                        )}
                        <div className="blog-card-body">
                          <time className="blog-card-date">{publishedAt}</time>
                          <h3 className="blog-card-title">{article.title}</h3>
                          {article.excerpt && (
                            <div 
                              className="blog-card-excerpt" 
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.excerpt) }} 
                            />
                          )}
                          <span className="blog-card-read-more">Read more →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="blog-empty-message">
                  No articles published yet. Check back soon!
                </p>
              )}
            </div>
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}

const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
        articles(first: 4, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            id
            title
            handle
            publishedAt
            excerpt: excerptHtml
            image {
              id
              altText
              url
              width
              height
            }
            blog {
              handle
            }
          }
        }
      }
    }
  }
` as const;
