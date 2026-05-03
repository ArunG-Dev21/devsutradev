/**
 * Canonical list of collection handles shown in the desktop sub-nav,
 * the side menu, and the mobile collection rail — in display order.
 *
 * The handles must match Shopify exactly. Titles are NOT hardcoded here:
 * they are pulled from each collection's `title` field in the Shopify
 * response so the storefront stays in sync with the admin.
 *
 * If a handle is missing from Shopify (e.g. a collection was deleted),
 * it is silently skipped instead of rendering a 404 link.
 */
export const SECONDARY_NAV_HANDLES = [
  'karungali',
  'rudraksha',
  'bracelets',
  'shiva-linga',
  'pyrite-stones',
  'pyramids',
] as const;

export type SecondaryNavCollection = {
  id?: string;
  handle: string;
  title: string;
  image?: {url?: string | null; altText?: string | null} | null;
};

type CollectionNode = {
  id?: string;
  handle?: string | null;
  title?: string | null;
  image?: {url?: string | null; altText?: string | null} | null;
} | null;

type CollectionsConnection = {nodes?: ReadonlyArray<CollectionNode> | null} | null | undefined;

/**
 * Returns the secondary-nav collections in canonical order, with titles
 * pulled directly from Shopify. Missing handles are filtered out.
 */
export function getSecondaryNavItems(
  collections: CollectionsConnection,
): SecondaryNavCollection[] {
  const byHandle = new Map<string, SecondaryNavCollection>();
  for (const node of collections?.nodes ?? []) {
    if (!node?.handle || !node.title) continue;
    byHandle.set(node.handle, {
      id: node.id,
      handle: node.handle,
      title: node.title,
      image: node.image ?? null,
    });
  }
  return SECONDARY_NAV_HANDLES.flatMap((handle) => {
    const item = byHandle.get(handle);
    return item ? [item] : [];
  });
}
