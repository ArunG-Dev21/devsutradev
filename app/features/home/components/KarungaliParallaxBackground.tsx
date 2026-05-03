import { useEffect, useRef } from 'react';

/**
 * Wraps a section so its background is `/bg-karungali-section.png` with a
 * vertical parallax effect: as the user scrolls through the wrapper, the
 * image drifts upward relative to the surrounding content.
 *
 * The image is rendered 140% of the wrapper's height (20% overflow on
 * each side) and translated between +10% and -10% of its own height as
 * the wrapper progresses through the viewport, so the edges never reveal.
 *
 * The Karungali section's own `bg-background` is overridden to
 * `transparent` within this wrapper so the image actually shows through.
 *
 * Implementation notes:
 *   - rAF-throttled scroll listener (no per-frame layout thrash).
 *   - IntersectionObserver gates the listener to viewport-near time only.
 *   - Respects prefers-reduced-motion (static image, no animation).
 *   - No JS dependencies.
 */
export function KarungaliParallaxBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wrapper = wrapperRef.current;
    const image = imageRef.current;
    if (!wrapper || !image) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let inView = false;
    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = vh + rect.height;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
      const RANGE = 10; // % of image height
      const y = (0.5 - progress) * 2 * RANGE;
      image.style.transform = `translate3d(0, ${y.toFixed(2)}%, 0)`;
    };

    const onScroll = () => {
      if (!inView || rafId !== null) return;
      rafId = window.requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false;
        if (inView) update();
      },
      { rootMargin: '20% 0px' },
    );
    observer.observe(wrapper);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative isolate overflow-hidden">
      {/* Parallax image fills the entire wrapper. */}
      <div className="absolute inset-0 z-0">
        <img
          ref={imageRef}
          src="/bg-karungali-section.png"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute left-0 right-0 -top-[20%] w-full h-[140%] object-cover will-change-transform"
        />
      </div>

      {/* Content overlays the image; the wrapped section's solid bg is
          neutralized so the image shows through. */}
      <div className="relative z-10 [&>section]:bg-transparent">
        {children}
      </div>
    </div>
  );
}
