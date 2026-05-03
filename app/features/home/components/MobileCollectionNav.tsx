import { NavLink } from 'react-router';
import { Image } from '@shopify/hydrogen';
import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '~/root';
import { getSecondaryNavItems } from '~/lib/secondaryNav';

/**
 * Mobile-only collection navigation bar — mirrors the desktop SubNavIsland
 * that is hidden on small screens. Placed below the Swiper hero section.
 * Horizontally scrollable with no visible scrollbar.
 *
 * Pulls the same canonical list as the desktop sub-nav and the side menu,
 * with titles read directly from Shopify.
 */
export function MobileCollectionNav() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const collections = (rootData?.header as any)?.collections;
  const items = getSecondaryNavItems(collections);

  return (
    <div className="md:hidden bg-background border-b border-border shadow-[0_4px_10px_rgb(0,0,0,0.02)]">
      <div className="flex gap-5 px-5 py-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {items.map((item) => {
          const imageUrl = item.image?.url ?? null;

          return (
            <NavLink
              key={item.handle}
              to={`/collections/${item.handle}`}
              end
              prefetch="intent"
              className="flex flex-col items-center gap-2 shrink-0 group transition-all duration-200"
            >
              {({ isActive }) => (
                <>
                  {/* Circle image */}
                  <div
                    className={`
                      w-[4.25rem] h-[4.25rem] rounded-full overflow-hidden shrink-0
                    `}
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        width={136}
                        height={136}
                        sizes="136px"
                        className="w-full h-full object-cover transition-transform duration-300 group-active:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      text-[10px] tracking-[0.07em] uppercase font-semibold text-center leading-tight whitespace-nowrap
                      transition-colors duration-200
                      ${isActive ? 'text-[#F14514]' : 'text-foreground group-hover:text-[#F14514]'}
                    `}
                  >
                    {item.title}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
