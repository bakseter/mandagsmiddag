import { MessageCircle, Plus, Star, Trophy } from 'lucide-react';
import { Link, Outlet } from 'react-router';

import { useGetCurrentUserQuery } from '@/api/user';
import ErrorBoundary from '@/components/error-boundary';

const navLinkClass =
    'rounded-lg bg-zinc-900 p-2 text-white transition-colors hover:bg-zinc-700';

const Layout = () => {
    const { data: currentUser } = useGetCurrentUserQuery();

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link
                        to="/"
                        className="md:text-lg text-md font-semibold tracking-tight text-zinc-900 transition-colors hover:text-zinc-600"
                    >
                        Mandagsmiddag
                    </Link>

                    <nav className="flex items-center gap-2">
                        <Link
                            to="/chat"
                            title="Chat"
                            aria-label="Chat"
                            className={navLinkClass}
                        >
                            <MessageCircle size={18} />
                        </Link>

                        {currentUser?.isAdmin && (
                            <>
                                <Link
                                    to="/middag/ny"
                                    title="Ny middag"
                                    aria-label="Ny middag"
                                    className={navLinkClass}
                                >
                                    <Plus size={18} />
                                </Link>

                                <Link
                                    to="/admin/ratings"
                                    title="Ratings"
                                    aria-label="Ratings"
                                    className={navLinkClass}
                                >
                                    <Star size={18} />
                                </Link>

                                <Link
                                    to="/admin/penalty"
                                    title="Poeng"
                                    aria-label="Poeng"
                                    className={navLinkClass}
                                >
                                    <Trophy size={18} />
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-5xl px-6 py-10">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    );
};

export default Layout;
