import { Suspense } from "react";
import { NavLink, useLocation, Await, useAsyncValue } from "react-router";
import { useOptimisticCart } from "@shopify/hydrogen";
import { useAside } from "~/shared/components/Aside";
import type { CartApiQueryFragment } from "storefrontapi.generated";

interface MobileBottomNavProps {
  cart: Promise<CartApiQueryFragment | null>;
}

export function MobileBottomNav({ cart }: MobileBottomNavProps) {
  const location = useLocation();
  const { open } = useAside();

  const tabs = [
    {
      id: "karungali",
      label: "Karungali",
      to: "/collections/karungali",
      icon: "/icons/new.png",
    },
    {
      id: "menu",
      label: "Menu",
      action: () => open("mobile"),
      icon: "/icons/collection.png",
    },
    {
      id: "cart",
      label: "Cart",
      action: () => open("cart"),
      icon: null,
    },
    {
      id: "profile",
      label: "Profile",
      to: "/account",
      icon: "/icons/account.png",
    },
  ] as const;

  const baseClass =
    "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95 cursor-pointer dark:filter dark:brightness-0 dark:invert";

  return (
    <nav
      className="
        md:hidden
        fixed bottom-0 left-0 right-0
        z-50
        flex items-center justify-around
        bg-white dark:bg-black backdrop-blur-xl
        border-t border-border/60
        shadow-[0_-2px_20px_rgba(0,0,0,0.06)]
      "
      style={{
        height: "calc(4.375rem + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        /* ── Cart tab — inline SVG + live badge ── */
        if (tab.id === "cart") {
          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`${baseClass} text-black relative`}
              aria-label="Open cart"
            >
              <div className="relative">
                <img
                  src="/icons/bag-icon.png"
                  alt=""
                  width={32}
                  height={32}
                  sizes="32px"
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                />
                {/* Live cart count badge */}
                <Suspense fallback={null}>
                  <Await resolve={cart}>
                    {(resolvedCart) => <CartCount cart={resolvedCart} />}
                  </Await>
                </Suspense>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-medium mt-1 leading-none">
                {tab.label}
              </span>
            </button>
          );
        }

        /* ── NavLink tabs (Profile, New Arrivals) ── */
        if ("to" in tab && tab.to) {
          const isActive =
            location.pathname === tab.to ||
            location.pathname.startsWith(tab.to + "/");

          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              prefetch="intent"
              className={({ isActive: navActive }) =>
                `${baseClass} ${navActive || isActive ? "text-foreground" : "text-black dark:text-white"}`
              }
              aria-label={tab.label}
            >
              <img
                src={tab.icon as string}
                alt=""
                width={32}
                height={32}
                sizes="32px"
                className="w-8 h-8 object-contain"
                loading="lazy"
              />
              <span className="text-[10px] uppercase tracking-wider font-medium mt-1 leading-none">
                {tab.label}
              </span>
            </NavLink>
          );
        }

        /* ── Action tabs (Menu) ── */
        return (
          <button
            key={tab.id}
            onClick={"action" in tab ? tab.action : undefined}
            className={`${baseClass} text-black`}
            aria-label={tab.label}
          >
            <img
              src={tab.icon as string}
              alt=""
              width={32}
              height={32}
              sizes="32px"
              className="w-8 h-8 object-contain"
              loading="lazy"
            />
            <span className="text-[10px] uppercase tracking-wider font-medium mt-1 leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** 
 * Renders the count badge.
 * We pass the resolved value directly to avoid useAsyncValue which might have bundling issues in some environments.
 */
function CartCount({ cart: resolvedCart }: { cart: CartApiQueryFragment | null }) {
  const cart = useOptimisticCart(resolvedCart);
  const count = cart?.totalQuantity ?? 0;

  if (count === 0) return null;

  return (
    <span
      className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-black text-white dark:invert"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
