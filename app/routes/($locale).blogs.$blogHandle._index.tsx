import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blogs.$blogHandle._index';
import { Image, getPaginationVariables } from '@shopify/hydrogen';
import type { ArticleItemFragment } from 'storefrontapi.generated';
import { PaginatedResourceSection } from '~/features/collection/components/PaginatedResourceSection';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

export const meta: Route.MetaFunction = ({ data }) => {
  const blog = (data as { blog?: { seo?: { title?: string | null; description?: string | null } | null; title?: string | null } } | undefined)?.blog;

  return [
    { title: `${blog?.seo?.title || blog?.title || 'Blog'} | Devasutra` },
    {
      name: 'description',
      content:
        blog?.seo?.description ||
        `Read the latest articles from ${blog?.title || 'our blog'}.`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

async function loadCriticalData({ context, request, params }: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, { pageBy: 12 });

  if (!params.blogHandle) {
    throw new Response('blog not found', { status: 404 });
  }

  const [{ blog }] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', { status: 404 });
  }

  redirectIfHandleIsLocalized(request, { handle: params.blogHandle, data: blog });

  return { blog };
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
    timeZone: 'UTC',
  }).format(new Date(date));
}

function ArticleCard({
  article,
  loading,
  featured = false,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
  featured?: boolean;
}) {
  const plainExcerpt = stripHtml(article.contentHtml).slice(0, featured ? 200 : 130);

  if (featured) {
    return (
      <Link
        to={`/blogs/${article.blog.handle}/${article.handle}`}
        prefetch="intent"
        className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-gray-400 hover:shadow-sm sm:flex"
      >
        <div className="aspect-16/10 shrink-0 overflow-hidden bg-gray-100 sm:aspect-auto sm:w-[45%]">
          {article.image ? (
            <Image
              alt={article.image.altText || article.title}
              data={article.image}
              sizes="(min-width: 768px) 40vw, 100vw"
              loading={loading}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <span className="text-5xl opacity-20 text-gray-300">✦</span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-500">
              Latest
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
            {article.title}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <time>{formatDate(article.publishedAt!)}</time>
            {article.author?.name ? (
              <>
                <span>·</span>
                <span>By {article.author.name}</span>
              </>
            ) : null}
          </div>
          {plainExcerpt ? (
            <p className="mt-4 text-sm leading-[1.75] text-gray-500">
              {plainExcerpt}{plainExcerpt.length >= 200 ? '…' : ''}
            </p>
          ) : null}
          <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-gray-500 group-hover:text-gray-900 transition-colors">
            Read article
            <svg className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      prefetch="intent"
      className="group flex flex-col rounded-2xl border border-gray-200 bg-gray-50 transition-all hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-sm"
    >
      {/* Image with padding top/left/right, stays within the card */}
      <div className="px-3 pt-3">
        <div className="aspect-16/10 overflow-hidden rounded-xl bg-gray-100">
          {article.image ? (
            <Image
              alt={article.image.altText || article.title}
              data={article.image}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
              loading={loading}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <span className="text-4xl opacity-20 text-gray-300">✦</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <time className="text-[10px] text-gray-400">{formatDate(article.publishedAt!)}</time>
        <h3 className="mt-2 text-base font-medium leading-snug text-gray-900 line-clamp-2">
          {article.title}
        </h3>
        {plainExcerpt ? (
          <p className="mt-2 flex-1 text-sm leading-6 text-gray-500 line-clamp-3">
            {plainExcerpt}{plainExcerpt.length >= 130 ? '…' : ''}
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

export default function Blog() {
  const { blog } = useLoaderData<typeof loader>();
  const { articles } = blog;
  const [featuredArticle, ...restArticles] = articles.nodes;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <RouteBreadcrumbBanner variant="light" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors mb-2"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              All blogs
            </Link>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
              {blog.title}
            </h1>
          </div>
          <span className="shrink-0 text-sm text-gray-400">
            {articles.nodes.length} articles
          </span>
        </div>

        {/* Featured article */}
        {featuredArticle ? (
          <div className="mb-8">
            <ArticleCard article={featuredArticle} loading="eager" featured />
          </div>
        ) : null}

        {/* Article grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <PaginatedResourceSection<ArticleItemFragment> connection={articles}>
            {({ node: article, index }) =>
              index === 0 ? null : (
                <ArticleCard
                  key={article.id}
                  article={article}
                  loading={index < 5 ? 'eager' : 'lazy'}
                />
              )
            }
          </PaginatedResourceSection>
        </div>
      </div>
    </div>
  );
}

const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: PUBLISHED_AT,
        reverse: true
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
` as const;
