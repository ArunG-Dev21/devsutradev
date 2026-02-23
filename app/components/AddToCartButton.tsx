import { type FetcherWithComponents } from 'react-router';
import { CartForm, type OptimisticCartLineInput } from '@shopify/hydrogen';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{ lines }} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
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
            className={`w-full py-4 rounded-full text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 border flex justify-center items-center ${disabled ?? fetcher.state !== 'idle'
                ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-stone-900 border-stone-900 text-stone-50 hover:bg-stone-800 hover:border-stone-800 cursor-pointer shadow-sm hover:shadow-md'
              }`}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}
