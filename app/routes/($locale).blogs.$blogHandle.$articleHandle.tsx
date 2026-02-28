import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blogs.$blogHandle.$articleHandle';
import { Image } from '@shopify/hydrogen';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: `Devasutra | ${data?.article.title ?? ''}` }];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return { ...deferredData, ...criticalData };
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

  return { article, blogHandle, blogTitle: blog.title };
}

function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const { article, blogHandle, blogTitle } = useLoaderData<typeof loader>();
  const { title, image, contentHtml, author } = article;

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <div className="article-page">
      {/* Article Hero */}
      <div className="article-hero">
        {image && (
          <div className="article-hero-image">
            <Image data={image} sizes="100vw" loading="eager" />
          </div>
        )}
        <div className="article-hero-overlay" />
      </div>

      {/* Article Content */}
      <article className="article-content-wrapper">
        {/* Navigation */}
        <div className="article-nav">
          <Link to={`/blogs/${blogHandle}`} className="blog-back-link">
            ← Back to {blogTitle || 'Blog'}
          </Link>
        </div>

        {/* Header */}
        <header className="article-header">
          <h1 className="article-title">{title}</h1>
          <div className="article-meta">
            <time dateTime={article.publishedAt} className="article-date">
              {publishedDate}
            </time>
            {author?.name && (
              <>
                <span className="article-meta-separator">·</span>
                <address className="article-author">{author.name}</address>
              </>
            )}
          </div>
        </header>

        {/* Body */}
        <div
          dangerouslySetInnerHTML={{ __html: contentHtml }}
          className="article-body"
        />

        {/* Footer nav */}
        <div className="article-footer-nav">
          <Link to={`/blogs/${blogHandle}`} className="blog-back-link">
            ← Back to {blogTitle || 'Blog'}
          </Link>
        </div>
      </article>
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
