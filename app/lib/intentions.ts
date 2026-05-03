/**
 * Helpers for the "Shop by Intention" section.
 *
 * Data lives in Shopify as a metaobject of type `intention` with one entry per
 * intent (Wealth, Love, Protection, Spiritual, Health). Each entry links to a
 * real Shopify collection so the destination is a native PLP at
 * `/collections/<handle>` with sort/filter/SEO out of the box.
 *
 * Why a metaobject (not hard-coded JSX): merchandiser can add, rename, reorder
 * or recolor intents from the Shopify admin without a deploy.
 */

export interface IntentionItem {
  id: string;
  name: string;            // "Wealth"
  emoji: string;           // "💰" — fallback when icon is not uploaded
  focus: string;           // "prosperity, career, financial flow"
  collectionHandle: string;
  collectionTitle: string | null;
  iconUrl: string | null;       // SVG or PNG uploaded in admin
  iconIsSvg: boolean;
  displayOrder: number;
}

export const INTENTIONS_QUERY = `#graphql
  query Intentions {
    metaobjects(type: "intention", first: 20) {
      nodes {
        id
        handle
        fields {
          key
          value
          reference {
            ... on Collection {
              id
              handle
              title
            }
            ... on MediaImage {
              image { url altText width height }
            }
            ... on GenericFile {
              id
              url
              mimeType
            }
          }
        }
      }
    }
  }
` as const;

export function parseIntentions(raw: any): IntentionItem[] {
  const nodes = raw?.metaobjects?.nodes ?? [];

  return nodes
    .map((node: any): IntentionItem | null => {
      const fields = Object.fromEntries(
        (node.fields ?? []).map((f: any) => [f.key, f]),
      );

      const collectionRef = fields.linked_collection?.reference;
      const collectionHandle = collectionRef?.handle ?? null;
      if (!collectionHandle) return null;

      // Icon may live in either a MediaImage (PNG/JPG) or a GenericFile (SVG).
      const iconRef = fields.icon?.reference;
      const iconUrl =
        iconRef?.image?.url ??
        iconRef?.url ??
        null;
      const iconMime: string = iconRef?.mimeType ?? '';
      const iconIsSvg = iconMime.includes('svg') || (iconUrl?.toLowerCase().endsWith('.svg') ?? false);

      return {
        id: node.id as string,
        name: fields.name?.value ?? '',
        emoji: fields.emoji?.value ?? '',
        focus: fields.focus?.value ?? '',
        collectionHandle,
        collectionTitle: collectionRef?.title ?? null,
        iconUrl,
        iconIsSvg,
        displayOrder: parseInt(fields.display_order?.value ?? '0', 10),
      };
    })
    .filter((i: IntentionItem | null): i is IntentionItem => !!i && !!i.name)
    .sort((a: IntentionItem, b: IntentionItem) => a.displayOrder - b.displayOrder);
}
