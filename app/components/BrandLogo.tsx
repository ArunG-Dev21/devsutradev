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
        className={className ? `${className} dark:invert` : 'dark:invert'}
      />
    );
  }

  return (
    <>
      <img
        src={lightSrc}
        alt={alt}
        className={`dark:hidden ${className ?? ''}`.trim()}
      />
      <img
        src={darkSrc}
        alt={alt}
        className={`hidden dark:block ${className ?? ''}`.trim()}
      />
    </>
  );
}

