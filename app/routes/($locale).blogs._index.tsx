import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blogs._index';
import { getPaginationVariables, Image } from '@shopify/hydrogen';
import { PaginatedResourceSection } from '~/features/collection/components/PaginatedResourceSection';
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

function loadDeferredData(_args: Route.LoaderArgs) {
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
      image?: {
        id?: string | null;
        altText?: string | null;
        url: string;
        width?: number | null;
        height?: number | null;
      } | null;
      excerpt?: string | null;
      blog: { handle: string };
    }>;
  };
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
    : 'Shop Sacred Products';
}

function getTopicSummary(blog: BlogNode) {
  if (blog.seo?.description) return blog.seo.description;

  const handle = blog.handle.toLowerCase();
  if (handle.includes('rudraksha')) {
    return 'Guides on bead meaning, wearing practices, cleansing, and spiritual significance.';
  }
  if (handle.includes('karungali')) {
    return 'Read about grounding traditions, protective symbolism, and everyday sacred use.';
  }

  return 'Thoughtful articles, rituals, and practical guidance from the Devasutra journal.';
}

function TopicCard({ blog }: { blog: BlogNode }) {
  const articleCount = blog.articles.nodes.length;

  return (
    <Link
      to={`/blogs/${blog.handle}`}
      className="group flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-accent/20"
      prefetch="intent"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Topic
          </p>
          <span className="text-sm text-muted-foreground">
            {articleCount} {articleCount === 1 ? 'article' : 'articles'}
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-heading text-foreground">
          {blog.title}
        </h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {getTopicSummary(blog)}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
        <span>Explore topic</span>
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          {'->'}
        </span>
      </div>
    </Link>
  );
}

function FeaturedArticleCard({
  article,
}: {
  article: BlogNode['articles']['nodes'][number];
}) {
  const teaser = stripHtml(article.excerpt).slice(0, 180);

  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      className="group grid overflow-hidden rounded-[24px] border border-border/70 bg-card transition-colors hover:border-foreground/20 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]"
      prefetch="intent"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:h-full">
        {article.image ? (
          <Image
            alt={article.image.altText || article.title}
            data={article.image}
            sizes="(min-width: 1024px) 42vw, 100vw"
            loading="eager"
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
        <h3 className="mt-4 text-2xl font-heading leading-tight text-foreground sm:text-3xl">
          {article.title}
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">
          {formatDate(article.publishedAt)}
        </p>
        {teaser ? (
          <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
            {teaser}
            {teaser.length >= 180 ? '...' : ''}
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

function SecondaryArticleCard({
  article,
}: {
  article: BlogNode['articles']['nodes'][number];
}) {
  const teaser = stripHtml(article.excerpt).slice(0, 110);

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
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-stone-200 to-stone-100 dark:from-neutral-800 dark:to-neutral-900" />
        )}
      </div>

      <div className="pt-4">
        <p className="text-[11px] text-muted-foreground">
          {formatDate(article.publishedAt)}
        </p>
        <h3 className="mt-2 text-lg font-heading leading-snug text-foreground line-clamp-2">
          {article.title}
        </h3>
        {teaser ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-3">
            {teaser}
            {teaser.length >= 110 ? '...' : ''}
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

function BlogSection({ blog }: { blog: BlogNode }) {
  const [featuredArticle, ...secondaryArticles] = blog.articles.nodes;

  return (
    <section className="border-t border-border/70 pt-10 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Topic focus
          </p>
          <h2 className="mt-3 text-3xl font-heading text-foreground sm:text-4xl">
            {blog.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            {getTopicSummary(blog)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={getCollectionHrefFromHandle(blog.handle)}
            className="inline-flex items-center justify-center rounded-full border border-border/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            prefetch="intent"
          >
            {getCollectionLabel(blog.handle)}
          </Link>
          <Link
            to={`/blogs/${blog.handle}`}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85"
            prefetch="intent"
          >
            View all articles
          </Link>
        </div>
      </div>

      {featuredArticle ? (
        <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <FeaturedArticleCard article={featuredArticle} />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            {secondaryArticles.map((article) => (
              <SecondaryArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
            No articles published yet
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This section will appear here once new writing is published.
          </p>
        </div>
      )}
    </section>
  );
}

export default function Blogs() {
  const { blogs } = useLoaderData<typeof loader>();
  const blogNodes = blogs.nodes || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-muted/20">
        <RouteBreadcrumbBanner variant="light" />
        <div className="container px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Devasutra Journal
              </p>
              <h1 className="mt-4 font-heading text-4xl text-foreground sm:text-5xl">
                Guides and stories from the world of sacred traditions.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Explore thoughtful reading on Rudraksha, Karungali, sacred adornment, and everyday spiritual practice. Each section brings together the latest articles from a single topic.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/collections/rudraksha"
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85"
                >
                  Shop Rudraksha
                </Link>
                <Link
                  to="/collections/all"
                  className="inline-flex items-center justify-center rounded-full border border-border/80 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Explore All Products
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Browse by topic
              </p>
              <div className="mt-4 space-y-3">
                {blogNodes.map((blog: BlogNode) => (
                  <div
                    key={blog.handle}
                    className="flex items-center justify-between border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="font-medium text-foreground">{blog.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {blog.articles.nodes.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Topics
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {blogNodes.map((blog: BlogNode) => (
              <TopicCard key={blog.handle} blog={blog} />
            ))}
          </div>
        </div>

        <div className="mt-14 max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Latest from each section
          </p>
          <h2 className="mt-3 font-heading text-3xl text-foreground sm:text-4xl">
            Start with the featured reads.
          </h2>
        </div>

        <div className="mt-10 space-y-12">
          <PaginatedResourceSection<BlogNode> connection={blogs}>
            {({ node: blog }) => <BlogSection key={blog.handle} blog={blog} />}
          </PaginatedResourceSection>
        </div>
      </section>
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
