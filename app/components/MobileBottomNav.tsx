import { NavLink, useLocation } from "react-router";

interface MobileBottomNavProps {
  onOpenCollections: () => void;
}

export function MobileBottomNav({ onOpenCollections }: MobileBottomNavProps) {
  const location = useLocation();

  const tabs = [
    {
      id: "profile",
      label: "Profile",
      to: "/account",
      icon: "/icons/account.png",
    },
    {
      id: "collections",
      label: "Collections",
      action: onOpenCollections,
      icon: "/icons/collections.png",
    },
    {
      id: "new-arrivals",
      label: "New Arrivals",
      to: "/collections/new-arrivals",
      icon: "/icons/new.png",
    },
  ];

  return (
    <nav
      className="
      md:hidden
      fixed bottom-0 left-0 right-0
      z-50
      flex items-center justify-around
      h-[70px]
      bg-card/90 backdrop-blur-xl
      border-t border-border/60
      shadow-[0_-2px_20px_rgba(0,0,0,0.06)]
      safe-area-pb
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const isActive = tab.to
          ? location.pathname === tab.to ||
            location.pathname.startsWith(tab.to + "/")
          : false;

        // LINK TAB
        if (tab.to) {
          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              prefetch="intent"
              className={({ isActive: navActive }) =>
                `
                flex flex-col items-center justify-center
                flex-1 h-full
                transition-all duration-200
                active:scale-95
                ${
                  navActive || isActive
                    ? "text-black"
                    : "text-gray-700"
                }
              `
              }
              aria-label={tab.label}
            >
              <img
                src={tab.icon}
                alt=""
                className="w-8 h-8 object-contain"
                loading="lazy"
              />

              <span
                className="
                text-[10px]
                uppercase
                tracking-wider
                font-medium
                mt-1
                leading-none
              "
              >
                {tab.label}
              </span>
            </NavLink>
          );
        }

        // ACTION TAB
        return (
          <button
            key={tab.id}
            onClick={tab.action}
            className="
            flex flex-col items-center justify-center
            flex-1 h-full
            text-gray-700
            transition-all duration-200
            active:scale-95
            active:text-black
            cursor-pointer
          "
            aria-label={tab.label}
          >
            <img
              src={tab.icon}
              alt=""
              className="w-8 h-8 object-contain"
              loading="lazy"
            />

            <span
              className="
              text-[10px]
              uppercase
              tracking-wider
              font-medium
              mt-1
              leading-none
            "
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}