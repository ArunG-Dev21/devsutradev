import { Await, Link, useLocation } from 'react-router';
import { Suspense, useId, useMemo, useRef } from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import { Aside } from '~/shared/components/Aside';
import { Footer } from '~/shared/components/Footer';
import { Header, HeaderMenu } from '~/shared/components/Header';
import type { SubNavIslandHandle } from '~/shared/components/Header';
import { CartMain } from '~/features/cart/components/CartMain';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/features/search/components/SearchFormPredictive';
import { SearchResultsPredictive } from '~/features/search/components/SearchResultsPredictive';
import { FloatingControls } from '~/shared/components/FloatingControls';
import { TrustBadgesBar } from '~/features/home/components/TrustBadgesBar';
import { CartNotificationProvider } from '~/features/cart/components/CartNotification';
import { MobileBottomNav } from '~/shared/components/MobileBottomNav';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const subNavRef = useRef<SubNavIslandHandle | null>(null);
  const location = useLocation();
  const pathnameWithoutLocale = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments[0] && /^[a-z]{2}-[a-z]{2}$/i.test(segments[0])) {
      segments.shift();
    }
    return `/${segments.join('/')}`;
  }, [location.pathname]);
  const hasCustomBreadcrumbPlacement =
    pathnameWithoutLocale === '/collections' ||
    pathnameWithoutLocale.startsWith('/collections/');

  return (
    <Aside.Provider>
      <CartNotificationProvider>
      <FloatingControls />
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
          subNavRef={subNavRef}
        />
      )}
      {!hasCustomBreadcrumbPlacement ? <RouteBreadcrumbBanner variant="contrast" /> : null}
      <main className='bg- md:pb-0'>{children}</main>
      <TrustBadgesBar />
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
      <MobileBottomNav />
      </CartNotificationProvider>
    </Aside.Provider>
  );
}

function CartAside({ cart }: { cart: PageLayoutProps['cart'] }) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <SearchFormPredictive>
          {({ fetchResults, goToSearch, inputRef }) => (
            <div className="flex items-center gap-2.5 bg-muted border border-border rounded-full px-4 py-2.5 mb-4 overflow-hidden">
              {/* Search icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 shrink-0 text-muted-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>

              {/* Text input */}
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                onKeyDown={(e) => e.key === 'Enter' && goToSearch()}
                placeholder="Search sacred items…"
                ref={inputRef}
                type="text"
                list={queriesDatalistId}
                autoComplete="off"
                className="flex-1 bg-transparent border-none outline-none p-0 m-0 text-foreground text-[0.8rem] tracking-wide font-[inherit] placeholder:text-muted-foreground"
              />

              {/* Go button */}
              <button
                onClick={goToSearch}
                title="Search"
                className="shrink-0 bg-foreground text-background border-none rounded-full px-3.5 py-1 text-[0.7rem] font-semibold tracking-widest uppercase cursor-pointer transition-opacity duration-200 hover:opacity-80"
              >
                Go
              </button>
            </div>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({ items, total, term, state, closeSearch }) => {
            const { articles, collections, pages, products, queries } = items;

            if (state === 'loading' && term.current) {
              return <div style={{ padding: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>Searching…</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '0.75rem 1rem 5rem 1rem', // Added bottom padding (5rem)
                      marginTop: '0.5rem',
                      borderTop: '1px solid var(--color-primary-border)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--color-accent, #000)',
                      fontWeight: 600,
                    }}
                  >
                    View all results for &quot;{term.current}&quot; →
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
          collections={(header as any).collections}
        />
      </Aside>
    )
  );
}
