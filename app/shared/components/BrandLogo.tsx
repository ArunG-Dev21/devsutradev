type BrandLogoProps = {
  lightSrc: string;
  darkSrc?: string;
  alt: string;
  className?: string;
};

export function BrandLogo({ lightSrc, darkSrc, alt, className }: BrandLogoProps) {
  if (!darkSrc || darkSrc === lightSrc) {
    return (
      <img
        src={lightSrc}
        alt={alt}
        width={200}
        height={60}
        sizes="200px"
        className={className ? `${className} dark:invert` : 'dark:invert'}
      />
    );
  }

  return (
    <>
      <img
        src={lightSrc}
        alt={alt}
        width={200}
        height={60}
        sizes="200px"
        className={`dark:hidden ${className ?? ''}`.trim()}
      />
      <img
        src={darkSrc}
        alt={alt}
        width={200}
        height={60}
        sizes="200px"
        className={`hidden dark:block ${className ?? ''}`.trim()}
      />
    </>
  );
}
