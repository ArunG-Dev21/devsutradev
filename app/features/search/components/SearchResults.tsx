import { Link } from 'react-router';
import { Image, Money, Pagination } from '@shopify/hydrogen';
import { urlWithTrackingParams, type RegularSearchReturn } from '~/lib/search';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & { term: string }) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({ ...result.items, term });
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2 className="text-2xl font-heading text-foreground mb-6 border-b border-border pb-4">Articles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles?.nodes?.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <div className="bg-card border border-border rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 group" key={article.id}>
              <Link prefetch="intent" to={articleUrl} className="flex items-center justify-between text-lg font-medium text-foreground group-hover:text-muted-foreground block">
                <span>{article.title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SearchResultsPages({ term, pages }: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2 className="text-2xl font-heading text-foreground mb-6 border-b border-border pb-4">Pages</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages?.nodes?.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <div className="bg-card border border-border rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 group" key={page.id}>
              <Link prefetch="intent" to={pageUrl} className="flex items-center justify-between text-lg font-medium text-foreground group-hover:text-muted-foreground block">
                <span>{page.title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2 className="text-2xl font-heading text-foreground mb-8 border-b border-border pb-4">Products</h2>
      <Pagination connection={products}>
        {({ nodes, isLoading, NextLink, PreviousLink }) => {
          const ItemsMarkup = nodes.map((product) => {
            const productUrl = urlWithTrackingParams({
              baseUrl: `/products/${product.handle}`,
              trackingParams: product.trackingParameters,
              term,
            });

            const price = product?.selectedOrFirstAvailableVariant?.price;
            const image = product?.selectedOrFirstAvailableVariant?.image;

            return (
              <Link prefetch="intent" to={productUrl} key={product.id} className="group relative flex flex-col h-full animate-fade-up no-underline">
                <div className="relative overflow-hidden rounded-xl mb-4 bg-card border border-border flex-1 aspect-[4/5] shadow-silver transform transition-all duration-500 group-hover:-translate-y-1">
                  {image && (
                    <Image data={image} alt={product.title} sizes="(min-width: 45em) 400px, 100vw" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-muted/30 transition-colors duration-500" />
                </div>
                <div className="flex flex-col items-center text-center mt-auto px-2 pb-2">
                  <h3 className="text-[13px] md:text-sm font-medium text-foreground mb-1.5 transition-colors duration-300 group-hover:text-muted-foreground line-clamp-2 leading-relaxed">
                    {product.title}
                  </h3>
                  <div className="text-[13px] tracking-wide text-muted-foreground font-medium">
                    {price && <Money withoutTrailingZeros data={price} />}
                  </div>
                </div>
              </Link>
            );
          });

          return (
            <div>
              <div className="flex justify-center mb-10">
                <PreviousLink className="inline-block border border-border px-6 py-2 rounded-full text-sm font-medium text-foreground hover:bg-foreground hover:text-background transition-colors duration-300">
                  {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
                </PreviousLink>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                {ItemsMarkup}
              </div>
              <div className="flex justify-center mt-12">
                <NextLink className="inline-block border border-border px-6 py-2 rounded-full text-sm font-medium text-foreground hover:bg-foreground hover:text-background transition-colors duration-300">
                  {isLoading ? 'Loading...' : <span>Load more ↓</span>}
                </NextLink>
              </div>
            </div>
          );
        }}
      </Pagination>
    </div>
  );
}

function SearchResultsEmpty() {
  return (
    <div className="text-center py-20 px-6 bg-card border border-border rounded-xl">
      <h3 className="text-2xl font-subheading text-foreground mb-4">No results found</h3>
      <p className="text-muted-foreground text-lg max-w-md mx-auto">
        We could not find any sacred items matching your search. Try using different keywords or explore our collections.
      </p>
    </div>
  );
}
