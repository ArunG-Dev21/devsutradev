import { Await, Link } from 'react-router';
import { Suspense, useId } from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import { Aside } from '~/components/Aside';
import { Footer } from '~/components/Footer';
import { Header, HeaderMenu } from '~/components/Header';
import { CartMain } from '~/components/CartMain';
import { RouteBreadcrumbBanner } from '~/components/RouteBreadcrumbBanner';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import { SearchResultsPredictive } from '~/components/SearchResultsPredictive';
import { LandingOverlay } from '~/components/LandingOverlay';
import { AudioToggle } from '~/components/AudioToggle';

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
  return (
    <Aside.Provider>
      <LandingOverlay />
      <AudioToggle />
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
        />
      )}
      <RouteBreadcrumbBanner />
      <main>{children}</main>
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--color-bg-light)',
                border: '1px solid var(--color-primary-border)',
                borderRadius: '999px',
                padding: '10px 16px',
                margin: '0 0 16px 0',
                overflow: 'hidden',
                outline: 'none',
              }}
            >
              {/* Search icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                style={{ width: '16px', height: '16px', flexShrink: 0, opacity: 0.5 }}
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
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: 0,
                  margin: 0,
                  color: 'var(--color-text-main)',
                  fontSize: '0.8rem',
                  letterSpacing: '0.03em',
                  fontFamily: 'inherit',
                }}
              />

              {/* Go button */}
              <button
                onClick={goToSearch}
                title="Search"
                style={{
                  flexShrink: 0,
                  background: 'var(--color-accent, #000)',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '4px 14px',
                  color: 'var(--color-bg-dark)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
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
                      padding: '0.75rem 1rem',
                      marginTop: '0.5rem',
                      borderTop: '1px solid var(--color-primary-border)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--color-accent, #000)',
                      fontWeight: 600,
                    }}
                  >
                    View all results for "{term.current}" →
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
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}
