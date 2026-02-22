import { Link } from 'react-router';

interface BreadcrumbProps {
    productTitle: string;
    collectionTitle?: string;
    collectionHandle?: string;
}

/**
 * Breadcrumb navigation for the PDP.
 */
export function Breadcrumb({
    productTitle,
    collectionTitle,
    collectionHandle,
}: BreadcrumbProps) {
    return (
        <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-6 flex-wrap">
            <Link to="/" className="hover:text-stone-900 transition no-underline">
                Home
            </Link>
            <span>›</span>
            {collectionTitle && collectionHandle ? (
                <>
                    <Link
                        to={`/collections/${collectionHandle}`}
                        className="hover:text-stone-900 transition no-underline"
                    >
                        {collectionTitle}
                    </Link>
                    <span>›</span>
                </>
            ) : (
                <>
                    <Link
                        to="/collections/all"
                        className="hover:text-stone-900 transition no-underline"
                    >
                        Shop
                    </Link>
                    <span>›</span>
                </>
            )}
            <span className="text-neutral-700 truncate max-w-[200px] md:max-w-none">
                {productTitle}
            </span>
        </nav>
    );
}
