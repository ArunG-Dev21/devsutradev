import { Suspense } from 'react';
import { Await, NavLink } from 'react-router';
import type { FooterQuery, HeaderQuery } from 'storefrontapi.generated';
import { SITE_NAME } from '~/lib/constants';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="border-t border-primary-border text-text-main w-full">
            <div className="container mx-auto px-6 sm:px-10 lg:px-16 pt-10 pb-10">

              {/* ───────────── Main Section ───────────── */}
              <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16 mb-16">

                {/* LEFT — Branding & About */}
                <div className="w-full lg:w-[40%] flex flex-col items-start text-left mb-10 lg:mb-0">
                  <div className="w-fit mb-6 lg:mb-8">
                    <img
                      src="/logo-branding.png"
                      alt="Brand Logo"
                      width={200}
                      height={100}
                      sizes="(min-width: 1024px) 192px, 128px"
                      className="w-32 lg:w-48 object-contain dark:invert dark:brightness-0"
                    />
                  </div>
                  <p className="text-text-muted text-[13px] leading-relaxed max-w-sm mb-8 lg:mb-10">
                    Handpicked and energised with Vedic mantras — crafted to bring harmony, protection, and spiritual clarity to your daily life. We offer authentic, lab-certified spiritual products directly to you.
                  </p>

                  {/* Social Icons */}
                  <div className="flex items-center gap-4">
                    {[
                      { icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>, url: '#', label: 'Instagram' },
                      { icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>, url: '#', label: 'Facebook' },
                      { icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>, url: '#', label: 'YouTube' },
                      { icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>, url: '#', label: 'WhatsApp' }
                    ].map((social) => (
                      <a
                        key={social.label}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-primary-border/10 border border-primary-border/20 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-primary-border/20 transition-all duration-300 hover:-translate-y-1"
                        aria-label={social.label}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>

                {/* RIGHT — Links */}
                <div className="w-full lg:w-[60%] lg:pl-16 text-left">
                  <div className="grid grid-cols-2 gap-8 lg:gap-14">

                    {/* Quick Links */}
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-5 text-text-main">
                        Quick Links
                      </h4>
                      <ul className="space-y-3">
                        {[
                          { title: 'Home', url: '/' },
                          { title: 'Shop All', url: '/collections/all' },
                          { title: 'About Us', url: '/pages/about' },
                          { title: 'Contact', url: '/pages/contact' },
                          { title: 'Blog', url: '/blogs' },
                        ].map((link) => (
                          <li key={link.title}>
                            <NavLink
                              to={link.url}
                              prefetch="intent"
                              className="text-text-muted hover:text-text-main text-[13px] transition-colors duration-300 relative group flex items-center w-fit"
                            >
                              <span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[14px] leading-none mt-[1px]">&#8227;</span>
                              <span className="group-hover:translate-x-1.5 transition-transform duration-300 block">{link.title}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Policies */}
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-5 text-text-main">
                        Policies
                      </h4>
                      <ul className="space-y-3">
                        {footer?.menu
                          ? footer.menu.items.map((item) => {
                            if (!item.url) return null;

                            const url =
                              item.url.includes('myshopify.com') ||
                                item.url.includes(publicStoreDomain) ||
                                item.url.includes(
                                  header.shop.primaryDomain?.url || '',
                                )
                                ? new URL(item.url).pathname
                                : item.url;

                            return (
                              <li key={item.id}>
                                <NavLink
                                  to={url}
                                  prefetch="intent"
                                  className="text-text-muted hover:text-text-main text-[13px] transition-colors duration-300 relative group flex items-center w-fit"
                                >
                                  <span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[14px] leading-none mt-[1px]">&#8227;</span>
                                  <span className="group-hover:translate-x-1.5 transition-transform duration-300 block">{item.title}</span>
                                </NavLink>
                              </li>
                            );
                          })
                          : FALLBACK_POLICY_LINKS.map((link) => (
                            <li key={link.title}>
                              <NavLink
                                to={link.url}
                                className="text-text-muted hover:text-text-main text-[13px] transition-colors duration-300 relative group flex items-center w-fit"
                              >
                                <span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[14px] leading-none mt-[1px]">&#8227;</span>
                                <span className="group-hover:translate-x-1.5 transition-transform duration-300 block">{link.title}</span>
                              </NavLink>
                            </li>
                          ))}
                      </ul>
                    </div>

                  </div>
                </div>

              </div>

              {/* ───────────── Bottom Bar ───────────── */}
              <div className="border-t border-primary-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-text-muted">
                <div>
                  © {new Date().getFullYear()} {header.shop.name || SITE_NAME}
                </div>

                <div className="flex gap-6">
                  <span>All Rights Reserved</span>
                  <span>Made in India</span>
                </div>
              </div>

            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

const FALLBACK_POLICY_LINKS = [
  { title: 'Privacy Policy', url: '/policies/privacy-policy' },
  { title: 'Refund Policy', url: '/policies/refund-policy' },
  { title: 'Shipping Policy', url: '/policies/shipping-policy' },
  { title: 'Terms of Service', url: '/policies/terms-of-service' },
];
