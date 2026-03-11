import { Link, Outlet } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import { useGetCurrentUserQuery } from '../services/user';

const Layout = () => {
    const { data: currentUser } = useGetCurrentUserQuery();

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link
                        to="/"
                        className="text-lg font-semibold tracking-tight text-zinc-900 transition-colors hover:text-zinc-600"
                    >
                        Mandagsmiddag
                    </Link>

                    <nav className="flex items-center gap-5 text-sm font-medium text-zinc-600">
                        {currentUser?.isAdmin && (
                            <Link
                                to="/middag/ny"
                                className="rounded-lg bg-zinc-900 px-3 py-2 text-white transition-colors hover:bg-zinc-700"
                            >
                                Ny middag
                            </Link>
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
