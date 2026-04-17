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
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return { ...deferredData, ...criticalData };
}

async function loadCriticalData({ context, request, params }: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 9,
  });

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

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

function stripHtml(html?: string | null) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function getCollectionHrefFromHandle(handle: string) {
  return handle.toLowerCase().includes('rudraksha')
    ? '/collections/rudraksha'
    : '/collections/all';
}

function getCollectionLabel(handle: string) {
  return handle.toLowerCase().includes('rudraksha')
    ? 'Shop Rudraksha'
    : 'Explore All Products';
}

function getBlogSummary(blog: { handle?: string | null; seo?: { description?: string | null } | null }) {
  if (blog.seo?.description) return blog.seo.description;

  const handle = blog.handle?.toLowerCase() || '';
  if (handle.includes('rudraksha')) {
    return 'Practical guides on bead meaning, wearing, care, and spiritual significance.';
  }
  if (handle.includes('karungali')) {
    return 'Stories and guidance around grounding traditions, symbolism, and devotional use.';
  }
  if (handle.includes('news')) {
    return 'Updates, new arrivals, insights, and thoughtful writing from the Devasutra journal.';
  }

  return 'A focused collection of articles from the Devasutra journal.';
}

function FeaturedArticleCard({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  const plainExcerpt = stripHtml(article.contentHtml).slice(0, 220);

  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      className="group overflow-hidden rounded-[24px] border border-border/70 bg-card transition-colors hover:border-foreground/20 lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]"
      prefetch="intent"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:h-full">
        {article.image ? (
          <Image
            alt={article.image.altText || article.title}
            data={article.image}
            sizes="(min-width: 1024px) 48vw, 100vw"
            loading={loading}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-stone-200 to-stone-100 dark:from-neutral-800 dark:to-neutral-900" />
        )}
      </div>

      <div className="flex flex-col justify-center p-6 sm:p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Featured article
        </p>
        <h2 className="mt-4 text-2xl font-heading leading-tight text-foreground sm:text-3xl">
          {article.title}
        </h2>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{formatDate(article.publishedAt!)}</span>
          {article.author?.name ? <span>By {article.author.name}</span> : null}
        </div>
        {plainExcerpt ? (
          <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
            {plainExcerpt}
            {plainExcerpt.length >= 220 ? '...' : ''}
          </p>
        ) : null}
        <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          Read article
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function ArticleCard({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  const plainExcerpt = stripHtml(article.contentHtml).slice(0, 140);

  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      className="group rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/20"
      prefetch="intent"
    >
      <div className="relative aspect-[16/11] overflow-hidden rounded-xl bg-muted">
        {article.image ? (
          <Image
            alt={article.image.altText || article.title}
            data={article.image}
            sizes="(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 100vw"
            loading={loading}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-stone-200 to-stone-100 dark:from-neutral-800 dark:to-neutral-900" />
        )}
      </div>

      <div className="pt-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>{formatDate(article.publishedAt!)}</span>
          {article.author?.name ? <span>By {article.author.name}</span> : null}
        </div>
        <h3 className="mt-2 text-xl font-heading leading-snug text-foreground line-clamp-2">
          {article.title}
        </h3>
        {plainExcerpt ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-3">
            {plainExcerpt}
            {plainExcerpt.length >= 140 ? '...' : ''}
          </p>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
          Continue reading
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            {'->'}
          </span>
        </span>
      </div>
    </Link>
  );
}

export default function Blog() {
  const { blog } = useLoaderData<typeof loader>();
  const { articles } = blog;
  const articleCount = articles.nodes.length;
  const collectionHref = getCollectionHrefFromHandle(blog.handle || '');
  const [featuredArticle] = articles.nodes;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-muted/20">
        <RouteBreadcrumbBanner variant="light" />
        <div className="container px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] lg:items-end">
            <div className="max-w-3xl">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <span>{'<-'}</span>
                <span>All blogs</span>
              </Link>
              <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Devasutra Journal
              </p>
              <h1 className="mt-4 font-heading text-4xl text-foreground sm:text-5xl">
                {blog.title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {getBlogSummary(blog)}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={collectionHref}
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85"
                >
                  {getCollectionLabel(blog.handle || '')}
                </Link>
                {featuredArticle ? (
                  <Link
                    to={`/blogs/${featuredArticle.blog.handle}/${featuredArticle.handle}`}
                    className="inline-flex items-center justify-center rounded-full border border-border/80 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    Read featured article
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                This section
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-medium text-foreground">Articles</span>
                  <span className="text-sm text-muted-foreground">
                    {articleCount}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-medium text-foreground">Topic</span>
                  <span className="text-sm text-muted-foreground">
                    {blog.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Related shop</span>
                  <span className="text-sm text-muted-foreground">
                    {getCollectionLabel(blog.handle || '')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        {featuredArticle ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Featured read
            </p>
            <div className="mt-4">
              <FeaturedArticleCard article={featuredArticle} loading="eager" />
            </div>
          </div>
        ) : null}

        <div className="mt-14 max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            More articles
          </p>
          <h2 className="mt-3 font-heading text-3xl text-foreground sm:text-4xl">
            Continue exploring this topic.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <PaginatedResourceSection<ArticleItemFragment> connection={articles}>
            {({ node: article, index }) =>
              index === 0 ? null : (
                <ArticleCard
                  article={article}
                  key={article.id}
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
              )
            }
          </PaginatedResourceSection>
        </div>
      </section>
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
