import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './layouts/Layout';
import DinnersPage from './pages/DinnersPage';
import EditDinnerPage from './pages/EditDinnerPage';
import HomePage from './pages/HomePage';
import NewDinnerPage from './pages/NewDinnerPage';
import RatingsPage from './pages/RatingsPage';
import { useGetCurrentUserQuery } from './services/user';

const App = () => {
    const { data: currentUser } = useGetCurrentUserQuery();

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/middag" element={<DinnersPage />} />
                        <Route path="/rating" element={<RatingsPage />} />
                        <Route
                            path="/middag/:dinnerId/rediger"
                            element={<EditDinnerPage />}
                        />
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
