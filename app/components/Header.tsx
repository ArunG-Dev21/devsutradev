import { Suspense } from 'react';
import { Await, NavLink, useAsyncValue } from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type { HeaderQuery, CartApiQueryFragment } from 'storefrontapi.generated';
import { useAside } from '~/components/Aside';
import { SUB_NAV_ITEMS } from '~/lib/constants';
import { SEARCH_ENDPOINT } from '~/components/SearchFormPredictive';
import { useRef } from 'react';

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between relative">
        {/* Mobile Menu Toggle (left on mobile) */}
        <div className="md:hidden">
          <HeaderMenuMobileToggle />
        </div>

        {/* Logo — centered */}
        <NavLink
          to="/"
          end
          prefetch="intent"
          className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:flex-1 text-center"
        >
          <span
            className="text-2xl md:text-3xl font-bold tracking-[0.15em] uppercase"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {shop.name}
          </span>
        </NavLink>

        {/* Desktop Menu — hidden on mobile */}
        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />

        {/* Right Side Icons */}
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>

      {/* Floating Sub-Nav Island — desktop only */}
      <SubNavIsland />
    </header>
  );
}

/** Floating pill-shaped sub-navigation bar */
function SubNavIsland() {
  return (
    <div className="hidden md:flex justify-center relative" style={{ marginBottom: '-20px' }}>
      <nav
        className="bg-white shadow-lg rounded-full px-2 py-1.5 flex items-center gap-1 relative z-50"
        style={{ transform: 'translateY(-50%)' }}
      >
        {SUB_NAV_ITEMS.map((item, idx) => (
          <NavLink
            key={item.title}
            to={item.link}
            prefetch="intent"
            className={({ isActive }) =>
              `px-5 py-2 text-xs tracking-[0.15em] uppercase rounded-full transition-all duration-300 ${isActive
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
              }`
            }
          >
            {item.title}
          </NavLink>
        ))}
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

  return (
    <nav
      role="navigation"
      className={
        viewport === 'desktop'
          ? 'hidden md:flex items-center gap-8 text-xs tracking-[0.12em] uppercase'
          : 'flex flex-col gap-4 text-base uppercase'
      }
    >
      {viewport === 'mobile' && (
        <NavLink
          to="/"
          end
          onClick={close}
          className="py-2 border-b border-neutral-100 hover:text-[#C5A355] transition"
        >
          Home
        </NavLink>
      )}

      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
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
              viewport === 'desktop'
                ? `transition-all duration-300 hover:text-[#C5A355] ${isActive ? 'text-[#C5A355] font-semibold' : 'text-neutral-700'
                }`
                : `py-2 border-b border-neutral-100 transition hover:text-[#C5A355] ${isActive ? 'text-[#C5A355] font-semibold' : ''
                }`
            }
          >
            {item.title}
          </NavLink>
        );
      })}

      {/* Mobile-only: sub-nav items */}
      {viewport === 'mobile' && (
        <>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mt-4 mb-1">
            Collections
          </p>
          {SUB_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.title}
              to={item.link}
              onClick={close}
              className="py-2 border-b border-neutral-100 hover:text-[#C5A355] transition"
            >
              {item.title}
            </NavLink>
          ))}
        </>
      )}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="flex items-center gap-3 md:gap-4">
      {/* Inline Search Bar — desktop only */}
      <DesktopSearchBar />

      {/* Account */}
      <NavLink
        to="/account"
        prefetch="intent"
        className="hover:text-[#C5A355] transition hidden md:block"
        aria-label="Account"
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
      className="p-1 hover:text-[#C5A355] transition cursor-pointer"
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

/** Inline search bar shown in the header on desktop screens */
function DesktopSearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value?.trim();
    if (q) {
      window.location.href = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}`;
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden md:flex items-center bg-neutral-100 rounded-full px-3 py-1.5 gap-2 w-48 lg:w-64 transition-all focus-within:ring-1 focus-within:ring-[#C5A355] focus-within:bg-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4 text-neutral-400 flex-shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        ref={inputRef}
        type="search"
        name="q"
        placeholder="Search sacred items…"
        className="flex-1 bg-transparent text-xs text-neutral-700 placeholder-neutral-400 outline-none border-none"
      />
    </form>
  );
}

/** Search icon toggle — mobile only */
function SearchToggle() {
  const { open } = useAside();

  return (
    <button
      onClick={() => open('search')}
      className="md:hidden hover:text-[#C5A355] transition cursor-pointer"
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
      className="relative hover:text-[#C5A355] transition cursor-pointer"
      aria-label={`Cart with ${count ?? 0} items`}
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
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
      {(count ?? 0) > 0 && (
        <span
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ backgroundColor: '#C5A355', color: '#fff' }}
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