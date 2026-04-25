// Reads the logged-in customer's wishlist metafield.
// NOTE: requires a Shopify metafield definition at:
//   Settings → Custom data → Customers → Add definition
//     namespace: custom
//     key: wishlist
//     type: list.product_reference
//     Customer access: Read & write   (so the Customer Account API can write it)
export const CUSTOMER_WISHLIST_QUERY = `#graphql
  query CustomerWishlist {
    customer {
      id
      metafield(namespace: "custom", key: "wishlist") {
        value
        type
      }
    }
  }
` as const;

export const CUSTOMER_WISHLIST_SET_MUTATION = `#graphql
  mutation CustomerWishlistSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;
