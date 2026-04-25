import { useEffect } from 'react';
import { useFetcher } from 'react-router';

const ENDPOINT = '/api/wishlist';

type LoadData = { wishlist: string[]; isLoggedIn: boolean };
type MutateData = { ok: boolean; error?: string; wishlist?: string[] };

function applyOp(current: string[], productId: string, op: string): string[] {
  if (!productId) return current;
  if (op === 'remove') return current.filter((id) => id !== productId);
  if (op === 'add') {
    return current.includes(productId) ? current : [...current, productId];
  }
  return current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
}

export function useWishlist() {
  const loadFetcher = useFetcher<LoadData>({ key: 'wishlist:load' });
  const mutateFetcher = useFetcher<MutateData>({ key: 'wishlist:mutate' });

  useEffect(() => {
    if (loadFetcher.state === 'idle' && !loadFetcher.data) {
      loadFetcher.load(ENDPOINT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseWishlist =
    mutateFetcher.data?.wishlist ?? loadFetcher.data?.wishlist ?? [];

  // Optimistic — while a mutation is in flight, reflect the intended next state.
  const wishlist = mutateFetcher.formData
    ? applyOp(
        baseWishlist,
        String(mutateFetcher.formData.get('productId') || ''),
        String(mutateFetcher.formData.get('op') || 'toggle'),
      )
    : baseWishlist;

  const isLoggedIn = loadFetcher.data?.isLoggedIn ?? false;
  const isLoaded =
    loadFetcher.state === 'idle' && loadFetcher.data !== undefined;
  const isMutating = mutateFetcher.state !== 'idle';

  function isInWishlist(productId: string) {
    return wishlist.includes(productId);
  }

  function submit(productId: string, op: 'toggle' | 'add' | 'remove') {
    if (!productId) return;
    const fd = new FormData();
    fd.append('productId', productId);
    fd.append('op', op);
    mutateFetcher.submit(fd, { method: 'post', action: ENDPOINT });
  }

  return {
    wishlist,
    isLoggedIn,
    isLoaded,
    isMutating,
    isInWishlist,
    toggle: (productId: string) => submit(productId, 'toggle'),
    add: (productId: string) => submit(productId, 'add'),
    remove: (productId: string) => submit(productId, 'remove'),
  };
}
