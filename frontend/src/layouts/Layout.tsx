import { Link, Outlet } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import { useGetCurrentUserQuery } from '../services/user';

const Layout = () => {
    const { data: currentUser } = useGetCurrentUserQuery();

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top nav */}
            <header className="border-b p-4 flex gap-4">
                <Link to="/">Hjem</Link>
                <Link to="/middag">Alle middager</Link>
                {currentUser?.isAdmin && <Link to="/middag/ny">Ny middag</Link>}
            </header>

            {/* Main content */}
            <main className="flex-1 p-6">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    );
};

export default Layout;
