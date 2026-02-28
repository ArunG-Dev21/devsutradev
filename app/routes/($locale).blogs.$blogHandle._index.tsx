import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blogs.$blogHandle._index';
import { Image, getPaginationVariables } from '@shopify/hydrogen';
import type { ArticleItemFragment } from 'storefrontapi.generated';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: `Devasutra | ${data?.blog.title ?? ''}` }];
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
    throw new Response(`blog not found`, { status: 404 });
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

function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

export default function Blog() {
  const { blog } = useLoaderData<typeof loader>();
  const { articles } = blog;

  return (
    <div className="blog-listing-page">
      {/* Hero Header */}
      <div className="blog-hero">
        <div className="blog-hero-content">
          <Link to="/blogs" className="blog-back-link">
            ← All Blogs
          </Link>
          <h1 className="blog-hero-title">{blog.title}</h1>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="blog-listing-container">
        <div className="blog-articles-grid">
          <PaginatedResourceSection<ArticleItemFragment> connection={articles}>
            {({ node: article, index }) => (
              <ArticleCard
                article={article}
                key={article.id}
                loading={index < 3 ? 'eager' : 'lazy'}
                featured={index === 0}
              />
            )}
          </PaginatedResourceSection>
        </div>
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  loading,
  featured,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
  featured?: boolean;
}) {
  const publishedAt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt!));

  // Strip HTML tags for excerpt display
  const plainExcerpt = article.contentHtml
    ? article.contentHtml.replace(/<[^>]*>/g, '').slice(0, 150) + '…'
    : '';

  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      className={`blog-card ${featured ? 'blog-card-featured' : ''}`}
      prefetch="intent"
    >
      {article.image && (
        <div className="blog-card-image">
          <Image
            alt={article.image.altText || article.title}
            data={article.image}
            sizes={featured ? '(min-width: 768px) 60vw, 100vw' : '(min-width: 768px) 30vw, 100vw'}
            loading={loading}
          />
        </div>
      )}
      <div className="blog-card-body">
        <div className="blog-card-meta">
          <time className="blog-card-date">{publishedAt}</time>
          {article.author?.name && (
            <span className="blog-card-author">by {article.author.name}</span>
          )}
        </div>
        <h3 className="blog-card-title">{article.title}</h3>
        {plainExcerpt && (
          <p className="blog-card-excerpt">{plainExcerpt}</p>
        )}
        <span className="blog-card-read-more">Read more →</span>
      </div>
    </Link>
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
