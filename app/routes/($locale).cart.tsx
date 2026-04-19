import { useLoaderData, data, type HeadersFunction } from 'react-router';
import type { Route } from './+types/($locale).cart';
import type { CartQueryDataReturn } from '@shopify/hydrogen';
import { CartForm } from '@shopify/hydrogen';
import { CartMain } from '~/features/cart/components/CartMain';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Your Cart | Devasutra' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
};

export const headers: HeadersFunction = ({ actionHeaders }) => actionHeaders;

export async function action({ request, context }: Route.ActionArgs) {
  const { cart } = context;

  const formData = await request.formData();

  const { action, inputs } = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result: CartQueryDataReturn;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd: {
      // Strip out selectedVariant (added for optimistic UI) before sending to Storefront API
      const sanitizedLines = inputs.lines.map((line: any) => {
        const { merchandiseId, quantity, attributes, sellingPlanId } = line;
        return { merchandiseId, quantity, attributes, sellingPlanId };
      });
      result = await cart.addLines(sanitizedLines);
      break;
    }
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = (
        formGiftCardCode ? [formGiftCardCode] : []
      ) as string[];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes as string[];
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const { cart: cartResult, errors, warnings } = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    { status, headers },
  );
}

export async function loader({ context }: Route.LoaderArgs) {
  const { cart } = context;
  return await cart.get();
}

export default function Cart() {
  const cart = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Area */}
      <div className="bg-card border-b border-border">
        <RouteBreadcrumbBanner variant="light" className="bg-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-5 sm:pb-8 md:pb-12 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-medium uppercase font-heading text-foreground tracking-tight">
            Your Basket
          </h1>
          <p className="mt-1 sm:mt-5 text-xs sm:text-xl text-black">
            Review your sacred items before proceeding to checkout.
          </p>
        </div>
      </div>

      {/* Main Cart Content */}
      <div className="flex-1 container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-12 w-full">
        <CartMain layout="page" cart={cart} />
      </div>
    </div>
  );
}
