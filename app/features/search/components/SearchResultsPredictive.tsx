import { Link, useFetcher, type Fetcher } from 'react-router';
import { Image, Money } from '@shopify/hydrogen';
import React, { useRef, useEffect } from 'react';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
  type PredictiveSearchReturn,
} from '~/lib/search';
import { useAside } from '~/shared/components/Aside';

type PredictiveSearchItems = PredictiveSearchReturn['result']['items'];

type UsePredictiveSearchReturn = {
  term: React.MutableRefObject<string>;
  total: number;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  items: PredictiveSearchItems;
  fetcher: Fetcher<PredictiveSearchReturn>;
};

type SearchResultsPredictiveArgs = Pick<
  UsePredictiveSearchReturn,
  'term' | 'total' | 'inputRef' | 'items'
> & {
  state: Fetcher['state'];
  closeSearch: () => void;
};

type PartialPredictiveSearchResult<
  ItemType extends keyof PredictiveSearchItems,
  ExtraProps extends keyof SearchResultsPredictiveArgs = 'term' | 'closeSearch',
> = Pick<PredictiveSearchItems, ItemType> &
  Pick<SearchResultsPredictiveArgs, ExtraProps>;

type SearchResultsPredictiveProps = {
  children: (args: SearchResultsPredictiveArgs) => React.ReactNode;
};

/**
 * Component that renders predictive search results
 */
export function SearchResultsPredictive({
  children,
}: SearchResultsPredictiveProps) {
  const aside = useAside();
  const { term, inputRef, fetcher, total, items } = usePredictiveSearch();

  /*
   * Utility that resets the search input
   */
  function resetInput() {
    if (inputRef.current) {
      inputRef.current.blur();
      inputRef.current.value = '';
    }
  }

  /**
   * Utility that resets the search input and closes the search aside
   */
  function closeSearch() {
    resetInput();
    aside.close();
  }

  return children({
    items,
    closeSearch,
    inputRef,
    state: fetcher.state,
    term,
    total,
  });
}

SearchResultsPredictive.Articles = SearchResultsPredictiveArticles;
SearchResultsPredictive.Collections = SearchResultsPredictiveCollections;
SearchResultsPredictive.Pages = SearchResultsPredictivePages;
SearchResultsPredictive.Products = SearchResultsPredictiveProducts;
SearchResultsPredictive.Queries = SearchResultsPredictiveQueries;
SearchResultsPredictive.Empty = SearchResultsPredictiveEmpty;

function SearchResultsPredictiveArticles({
  term,
  articles,
  closeSearch,
}: PartialPredictiveSearchResult<'articles'>) {
  if (!articles.length) return null;

  return (
    <div className="mb-6" key="articles">
      <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 px-2">Articles</h5>
      <ul className="flex flex-col gap-1">
        {articles.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
            trackingParams: article.trackingParameters,
            term: term.current ?? '',
          });

          return (
            <li key={article.id}>
              <Link
                onClick={closeSearch}
                to={articleUrl}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                {article.image?.url && (
                  <Image
                    alt={article.image.altText ?? ''}
                    src={article.image.url}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="w-16 h-16 rounded-lg object-cover bg-muted shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                    {article.title}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPredictiveCollections({
  term,
  collections,
  closeSearch,
}: PartialPredictiveSearchResult<'collections'>) {
  if (!collections.length) return null;

  return (
    <div className="mb-6" key="collections">
      <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 px-2">Collections</h5>
      <ul className="flex flex-col gap-1">
        {collections.map((collection) => {
          const collectionUrl = urlWithTrackingParams({
            baseUrl: `/collections/${collection.handle}`,
            trackingParams: collection.trackingParameters,
            term: term.current,
          });

          return (
            <li key={collection.id}>
              <Link
                onClick={closeSearch}
                to={collectionUrl}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                {collection.image?.url && (
                  <Image
                    alt={collection.image.altText ?? ''}
                    src={collection.image.url}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="w-16 h-16 rounded-lg object-cover bg-muted shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    {collection.title}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPredictivePages({
  term,
  pages,
  closeSearch,
}: PartialPredictiveSearchResult<'pages'>) {
  if (!pages.length) return null;

  return (
    <div className="mb-6" key="pages">
      <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 px-2">Pages</h5>
      <ul className="flex flex-col gap-1">
        {pages.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term: term.current,
          });

          return (
            <li key={page.id}>
              <Link
                onClick={closeSearch}
                to={pageUrl}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0 py-1">
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    {page.title}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPredictiveProducts({
  term,
  products,
  closeSearch,
}: PartialPredictiveSearchResult<'products'>) {
  if (!products.length) return null;

  return (
    <div className="mb-6" key="products">
      <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 px-2">Products</h5>
      <ul className="flex flex-col gap-1">
        {products.map((product) => {
          const productUrl = urlWithTrackingParams({
            baseUrl: `/products/${product.handle}`,
            trackingParams: product.trackingParameters,
            term: term.current,
          });

          const price = product?.selectedOrFirstAvailableVariant?.price;
          const image = product?.selectedOrFirstAvailableVariant?.image;
          return (
            <li key={product.id}>
              <Link
                to={productUrl}
                onClick={closeSearch}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                {image && (
                  <Image
                    alt={image.altText ?? ''}
                    src={image.url}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="w-16 h-16 rounded-lg object-cover bg-muted shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                    {product.title}
                  </p>
                  <div className="mt-1">
                    {price && (
                      <span className="text-sm font-medium text-foreground/70">
                        <Money className="font-montserrat" withoutTrailingZeros data={price} />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPredictiveQueries({
  queries,
  queriesDatalistId,
}: PartialPredictiveSearchResult<'queries', never> & {
  queriesDatalistId: string;
}) {
  if (!queries.length) return null;

  return (
    <datalist id={queriesDatalistId}>
      {queries.map((suggestion) => {
        if (!suggestion) return null;

        return <option key={suggestion.text} value={suggestion.text} />;
      })}
    </datalist>
  );
}

function SearchResultsPredictiveEmpty({
  term,
}: {
  term: React.MutableRefObject<string>;
}) {
  if (!term.current) {
    return null;
  }

  return (
    <p>
      No results found for <q>{term.current}</q>
    </p>
  );
}

/**
 * Hook that returns the predictive search results and fetcher and input ref.
 * @example
 * '''ts
 * const { items, total, inputRef, term, fetcher } = usePredictiveSearch();
 * '''
 **/
function usePredictiveSearch(): UsePredictiveSearchReturn {
  const fetcher = useFetcher<PredictiveSearchReturn>({ key: 'search' });
  const term = useRef<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (fetcher?.state === 'loading') {
    term.current = String(fetcher.formData?.get('q') || '');
  }

  // capture the search input element as a ref safely
  useEffect(() => {
    if (!inputRef.current) {
      const el = document.querySelector('input[type="search"], input.header-search-input');
      if (el instanceof HTMLInputElement) {
        inputRef.current = el;
      }
    }
  }, []);

  const { items, total } =
    fetcher?.data?.result ?? getEmptyPredictiveSearchResult();

  return { items, total, inputRef, term, fetcher };
}
