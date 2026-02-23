import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Await, NavLink, useAsyncValue, Link, useFetcher, useNavigate } from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
  Image,
  Money,
} from '@shopify/hydrogen';
import type { HeaderQuery, CartApiQueryFragment } from 'storefrontapi.generated';
import { useAside } from '~/components/Aside';
import { SUB_NAV_ITEMS } from '~/lib/constants';
import { SEARCH_ENDPOINT } from '~/components/SearchFormPredictive';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
  type PredictiveSearchReturn,
} from '~/lib/search';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const { shop, menu } = header;

  return (
    <header className="relative top-0 z-50 bg-black border-primary-border shadow-sm transition-all duration-300 text-text-main">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-8 flex items-center gap-4 relative">
        {/* Mobile Menu Toggle (left on mobile) */}
        <div className="md:hidden">
          <HeaderMenuMobileToggle />
        </div>

        {/* Logo — left on mobile, centered on desktop */}
        <NavLink
          to="/"
          end
          prefetch="intent"
          className="md:absolute md:left-1/2 md:-translate-x-1/2 -mt-7 shrink-0"
        >
          <img
            src="/logo-white-single.png"
            alt={shop.name}
            className="h-6 md:h-12 w-auto object-contain"
          />
        </NavLink>

        {/* Spacer to push icons right on desktop */}
        {/* Desktop Left Links (About + Contact) */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink
            to="/pages/about"
            className="text-xs lg:text-lg tracking-[0.18em] uppercase text-white hover:text-black transition"
          >
            About
          </NavLink>

          <NavLink
            to="/pages/contact"
            className="text-xs lg:text-lg tracking-[0.18em] uppercase text-white hover:text-black transition"
          >
            Contact
          </NavLink>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side Icons */}
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>

      {/* Floating Sub-Nav Island — desktop only, loops through Shopify menu links */}
      <SubNavIsland
        menu={menu}
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
    </header>
  );
}

/** Floating pill-shaped sub-navigation bar — uses Shopify menu links */
function SubNavIsland({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: string;
  publicStoreDomain: string;
}) {
  const rawItems = menu?.items?.length ? menu.items : FALLBACK_HEADER_MENU.items;

  // Filter out About + Contact
  const items = rawItems.filter(
    (item) =>
      !['About', 'Contact'].includes(item.title)
  );

  return (
    <div className="hidden md:flex justify-center absolute top-28 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <nav
        className="
        bg-black
        shadow-inner
        rounded-full
        px-2.5 py-2
        flex items-center gap-2
        relative z-50
        -translate-y-1
      "
      >
        {items.map((item) => {
          if (!item.url) return null;

          const url =
            item.url.includes('myshopify.com') ||
              item.url.includes(publicStoreDomain) ||
              item.url.includes(primaryDomainUrl)
              ? new URL(item.url).pathname
              : item.url;

          return (
            <NavLink
              key={item.id}
              to={url}
              end
              prefetch="intent"
              className={({ isActive }) =>
                `
              px-8 py-3
              text-sm tracking-[0.15em]
              uppercase
              font-semibold
              rounded-full
              transition-all duration-300
              ${isActive
                  ? 'bg-black text-white shadow-lg'
                  : 'text-black bg-white border border-gray-200'
                }
              `
              }
            >
              {item.title}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const { close } = useAside();
  const items = menu?.items?.length ? menu.items : FALLBACK_HEADER_MENU.items;

  return (
    <nav
      role="navigation"
      className="flex flex-col gap-4 text-base uppercase font-medium tracking-wide text-text-main"
    >
      <NavLink
        to="/"
        end
        onClick={close}
        className="py-3 border-b border-primary-border hover:text-accent transition-colors duration-300"
      >
        Home
      </NavLink>

      {items.map((item) => {
        if (!item.url) return null;

        const url =
          item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        return (
          <NavLink
            key={item.id}
            to={url}
            end
            prefetch="intent"
            onClick={close}
            className={({ isActive }) =>
              `py-3 border-b border-primary-border transition-colors duration-300 hover:text-accent ${isActive ? 'text-accent' : ''
              }`
            }
          >
            {item.title}
          </NavLink>
        );
      })}

      {/* Mobile-only: sub-nav / collection items from constants */}
      <p className="text-xs text-text-muted uppercase tracking-widest mt-4 mb-1">
        Collections
      </p>
      {SUB_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.title}
          to={item.link}
          onClick={close}
          className="py-2 border-b border-primary-border hover:text-accent transition"
        >
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="flex items-center gap-3 md:gap-4 ml-auto md:ml-0">
      {/* Inline Search Bar — desktop only */}
      <DesktopSearchBar />

      {/* Account — desktop only */}
      <NavLink
        to="/account"
        prefetch="intent"
        className="text-white transition hidden md:block"
        aria-label="Account"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 xl:w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </NavLink>

      {/* Search icon — mobile only */}
      <SearchToggle />

      {/* Cart */}
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const { open } = useAside();

  return (
    <button
      onClick={() => open('mobile')}
      className="p-1 hover:text-accent transition cursor-pointer"
      aria-label="Open menu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </button>
  );
}

/** Inline search bar with predictive dropdown — desktop only */
function DesktopSearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const fetcher = useFetcher<PredictiveSearchReturn>({ key: 'desktop-search' });
  const [open, setOpen] = useState(false);

  const { items, total } =
    fetcher?.data?.result ?? getEmptyPredictiveSearchResult();
  const term = String(fetcher.formData?.get('q') || inputRef.current?.value || '');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      if (q.length > 0) {
        setOpen(true);
        fetcher.submit(
          { q, limit: '5', predictive: 'true' },
          { method: 'GET', action: SEARCH_ENDPOINT },
        );
      } else {
        setOpen(false);
      }
    },
    [fetcher],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value?.trim();
    if (q) {
      setOpen(false);
      navigate(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}`);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeDropdown() {
    setOpen(false);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.blur();
    }
  }

  const hasResults = total > 0;
  const isLoading = fetcher.state === 'loading';

  return (
    <div ref={containerRef} className="hidden md:block relative">
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-white rounded-full px-5 py-3 gap-2 w-44 lg:w-64 transition-all border border-primary-border focus-within:ring-1 focus-within:ring-accent focus-within:bg-bg-subtle"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 text-text-muted flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          name="q"
          placeholder="Search sacred items…"
          onChange={handleChange}
          onFocus={(e) => {
            if (e.target.value.length > 0) setOpen(true);
          }}
          className="header-search-input flex-1 text-xs text-text-main placeholder-text-muted bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          autoComplete="off"
        />
      </form>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-80 lg:w-96 bg-white rounded-xl shadow-silver border border-primary-border overflow-hidden z-[200]"
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          {isLoading && term && (
            <div className="px-4 py-3 text-xs text-neutral-400">Searching…</div>
          )}

          {!isLoading && term && !hasResults && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-text-muted">No results for <q className="font-medium text-text-main">{term}</q></p>
            </div>
          )}

          {hasResults && (
            <>
              {items.products.length > 0 && (
                <div className="p-3">
                  <h6 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 px-1">Products</h6>
                  <ul className="space-y-1">
                    {items.products.map((product) => {
                      const productUrl = urlWithTrackingParams({
                        baseUrl: `/products/${product.handle}`,
                        trackingParams: product.trackingParameters,
                        term,
                      });
                      const image = product?.selectedOrFirstAvailableVariant?.image;
                      const price = product?.selectedOrFirstAvailableVariant?.price;
                      return (
                        <li key={product.id}>
                          <Link
                            to={productUrl}
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white transition-colors"
                          >
                            {image && (
                              <Image
                                alt={image.altText ?? ''}
                                src={image.url}
                                width={44}
                                height={44}
                                className="rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-main truncate">{product.title}</p>
                              {price && (
                                <span className="text-xs text-black font-medium">
                                  <Money data={price} />
                                </span>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {items.collections.length > 0 && (
                <div className="p-3 border-t border-primary-border">
                  <h6 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 px-1">Collections</h6>
                  <ul className="space-y-1">
                    {items.collections.map((collection) => {
                      const collectionUrl = urlWithTrackingParams({
                        baseUrl: `/collections/${collection.handle}`,
                        trackingParams: collection.trackingParameters,
                        term,
                      });
                      return (
                        <li key={collection.id}>
                          <Link
                            to={collectionUrl}
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bg-subtle transition-colors"
                          >
                            {collection.image?.url && (
                              <Image
                                alt={collection.image.altText ?? ''}
                                src={collection.image.url}
                                width={44}
                                height={44}
                                className="rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-sm text-text-main">{collection.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {items.pages.length > 0 && (
                <div className="p-3 border-t border-primary-border">
                  <h6 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 px-1">Pages</h6>
                  <ul className="space-y-1">
                    {items.pages.map((page) => {
                      const pageUrl = urlWithTrackingParams({
                        baseUrl: `/pages/${page.handle}`,
                        trackingParams: page.trackingParameters,
                        term,
                      });
                      return (
                        <li key={page.id}>
                          <Link
                            to={pageUrl}
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bg-subtle transition-colors"
                          >
                            <span className="text-sm text-text-main">{page.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="border-t border-primary-border">
                <Link
                  to={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(term)}`}
                  onClick={closeDropdown}
                  className="block px-4 py-3 text-center text-xs uppercase tracking-wider text-black hover:bg-gray-100 transition-colors font-medium"
                >
                  View all {total} results →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchToggle() {
  const { open } = useAside();

  return (
    <button
      onClick={() => open('search')}
      className="md:hidden hover:text-accent transition cursor-pointer"
      aria-label="Search"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
    </button>
  );
}

function CartBadge({ count }: { count: number | null }) {
  const { open } = useAside();
  const { publish, shop, cart, prevCart } = useAnalytics();

  return (
    <button
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      className="relative text-white transition cursor-pointer"
      aria-label={`Cart with ${count ?? 0} items`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 xl:w-8 xl:h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
      {(count ?? 0) > 0 && (
        <span
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-silver-dark)', color: 'var(--color-bg-dark)' }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function CartToggle({ cart }: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      title: 'Shop',
      url: '/collections/all',
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      title: 'About',
      url: '/pages/about',
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      title: 'Contact',
      url: '/pages/contact',
    },
  ],
};