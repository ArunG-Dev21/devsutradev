import { useEffect, useRef } from 'react';
import { type FetcherWithComponents } from 'react-router';
import { CartForm, type OptimisticCartLineInput } from '@shopify/hydrogen';
import { useCartNotification } from './CartNotification';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  productTitle,
  productImage,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
  productTitle?: string;
  productImage?: { url: string; altText?: string | null };
}) {
  return (
    <CartForm route="/cart" inputs={{ lines }} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <AddToCartInner
          fetcher={fetcher}
          analytics={analytics}
          disabled={disabled}
          onClick={onClick}
          productTitle={productTitle}
          productImage={productImage}
        >
          {children}
        </AddToCartInner>
      )}
    </CartForm>
  );
}

function AddToCartInner({
  fetcher,
  analytics,
  disabled,
  onClick,
  productTitle,
  productImage,
  children,
}: {
  fetcher: FetcherWithComponents<any>;
  analytics?: unknown;
  disabled?: boolean;
  onClick?: () => void;
  productTitle?: string;
  productImage?: { url: string; altText?: string | null };
  children: React.ReactNode;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    // Trigger notification when fetcher transitions from loading/submitting to idle
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage]);

  return (
    <>
      <input
        name="analytics"
        type="hidden"
        value={JSON.stringify(analytics)}
      />
      <button
        type="submit"
        onClick={onClick}
        disabled={disabled ?? fetcher.state !== 'idle'}
        className={`w-full py-4 rounded-full text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 border flex justify-center items-center gap-2 group ${disabled ?? fetcher.state !== 'idle'
            ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
            : 'bg-white border-gray-800 text-gray-800 hover:bg-black hover:border-black hover:text-white cursor-pointer'
          }`}
      >
        {children}
      </button>
    </>
  );
}
