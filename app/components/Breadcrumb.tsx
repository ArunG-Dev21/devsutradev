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
        <nav className="flex items-center gap-2.5 text-[10px] uppercase font-medium tracking-widest text-stone-400 flex-wrap">
            <Link to="/" className="hover:text-stone-900 transition-colors no-underline">
                Home
            </Link>
            <span className="text-stone-300 mt-[-1px]">›</span>
            {collectionTitle && collectionHandle ? (
                <>
                    <Link
                        to={`/collections/${collectionHandle}`}
                        className="hover:text-stone-900 transition-colors no-underline"
                    >
                        {collectionTitle}
                    </Link>
                    <span className="text-stone-300 mt-[-1px]">›</span>
                </>
            ) : (
                <>
                    <Link
                        to="/collections/all"
                        className="hover:text-stone-900 transition-colors no-underline"
                    >
                        Shop
                    </Link>
                    <span className="text-stone-300 mt-[-1px]">›</span>
                </>
            )}
            <span className="text-stone-900 truncate max-w-[200px] md:max-w-none">
                {productTitle}
            </span>
        </nav>
    );
}
