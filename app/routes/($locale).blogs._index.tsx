import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blogs._index';
import { getPaginationVariables, Image } from '@shopify/hydrogen';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Blog - Sacred Wisdom & Guides | Devasutra' },
    {
      name: 'description',
      content:
        'Explore insights, guides, and wisdom from the world of sacred traditions. Learn about Rudraksha, Karungali, gemstones, and spiritual practices.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

async function loadCriticalData({ context, request }: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, { pageBy: 20 });

  const [{ blogs }] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: { ...paginationVariables },
    }),
  ]);

  return { blogs };
}

interface ArticleNode {
  id: string;
  title: string;
  handle: string;
  publishedAt: string;
  image?: {
    id?: string | null;
    altText?: string | null;
    url: string;
    width?: number | null;
    height?: number | null;
  } | null;
  excerpt?: string | null;
  blog: { handle: string; title: string };
}

interface BlogNode {
  title: string;
  handle: string;
  articles: { nodes: ArticleNode[] };
}

function stripHtml(html?: string | null) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function ArticleCard({ article }: { article: ArticleNode }) {
  const teaser = stripHtml(article.excerpt).slice(0, 130);

  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      prefetch="intent"
      className="group flex flex-col rounded-2xl border border-gray-200 bg-gray-50 transition-all hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-sm"
    >
      {/* Image with padding on top/left/right, stays inside card */}
      <div className="px-3 pt-3">
        <div className="aspect-16/10 overflow-hidden rounded-xl bg-gray-100">
          {article.image ? (
            <Image
              data={article.image}
              alt={article.image.altText || article.title}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <span className="text-4xl opacity-20 text-gray-400">✦</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400">
            {article.blog.title}
          </span>
          <span className="text-gray-300">·</span>
          <time className="text-[10px] text-gray-400">{formatDate(article.publishedAt)}</time>
        </div>

        <h3 className="mt-2 text-base font-medium leading-snug text-gray-900 line-clamp-2">
          {article.title}
        </h3>

        {teaser ? (
          <p className="mt-2 flex-1 text-sm leading-6 text-gray-500 line-clamp-3">
            {teaser}{teaser.length >= 130 ? '…' : ''}
          </p>
        ) : null}

        <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-gray-500 group-hover:text-gray-900 transition-colors">
          Read more
          <svg className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default function Blogs() {
  const { blogs } = useLoaderData<typeof loader>();
  const blogNodes: BlogNode[] = blogs.nodes || [];

  // Flatten all articles from all blogs, sorted newest first
  const allArticles: ArticleNode[] = blogNodes
    .flatMap((blog) =>
      blog.articles.nodes.map((article) => ({
        ...article,
        blog: { handle: blog.handle, title: blog.title },
      })),
    )
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <RouteBreadcrumbBanner variant="light" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1">Devasutra</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">Journal</h1>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {blogNodes.map((blog) => (
              <Link
                key={blog.handle}
                to={`/blogs/${blog.handle}`}
                prefetch="intent"
                className="rounded-full border border-gray-200 px-4 py-1.5 text-[11px] uppercase tracking-wider text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                {blog.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Article grid */}
        {allArticles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {allArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-gray-400 text-sm">No articles published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        articles(first: 12, sortKey: PUBLISHED_AT, reverse: true) {
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
