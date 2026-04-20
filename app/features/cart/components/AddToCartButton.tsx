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
  const wasSubmitted = useRef(false);
  const notifiedOptimistically = useRef(false);
  const isDisabled = Boolean(disabled) || fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.state === 'submitting') wasSubmitted.current = true;
    if (wasSubmitted.current && fetcher.state === 'idle') {
      wasSubmitted.current = false;
      notifiedOptimistically.current = false;
    }
  }, [fetcher.state]);

  return (
    <>
      <input
        name="analytics"
        type="hidden"
        value={JSON.stringify(analytics)}
      />
      <button
        type="submit"
        onClick={() => {
          if (!isDisabled && !notifiedOptimistically.current) {
            notifiedOptimistically.current = true;
            showNotification(productTitle, productImage);
          }
          onClick?.();
        }}
        disabled={isDisabled}
        className={`w-full py-4 rounded-full text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 border flex justify-center items-center gap-2 group ${isDisabled
            ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
            : 'bg-white border-gray-800 text-gray-800 hover:bg-black hover:border-black hover:text-white cursor-pointer'
          }`}
      >
        {children}
      </button>
    </>
  );
}
