import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DinnersPage from './pages/DinnersPage';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import Layout from './layouts/Layout';
import NewDinnerPage from './pages/NewDinnerPage';
import { useGetCurrentUserQuery } from './services/user';

const App = () => {
    const { data: currentUser } = useGetCurrentUserQuery();

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route element={<Layout isAdmin={currentUser?.isAdmin} />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/middag" element={<DinnersPage />} />
                        {currentUser?.isAdmin && (
                            <Route
                                path="/middag/ny"
                                element={<NewDinnerPage />}
                            />
                        )}
                    </Route>
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
};

export default App;
