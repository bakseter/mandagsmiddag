import { BrowserRouter, Route, Routes } from 'react-router-dom';

import ErrorBoundary from '@/components/error-boundary';
import Layout from '@/layouts/layout';
import AddRatingPage from '@/pages/add-rating-page';
import AdminRatingsPage from '@/pages/admin-ratings-page';
import DinnersPage from '@/pages/dinners-page';
import EditDinnerPage from '@/pages/edit-dinner-page';
import EditRatingPage from '@/pages/edit-rating-page';
import NewDinnerPage from '@/pages/new-dinner-page';
import { useGetCurrentUserQuery } from '@/services/user';

const App = () => {
    const { data: currentUser } = useGetCurrentUserQuery();

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<DinnersPage />} />

                        <Route
                            path="/middag/:dinnerId/rediger"
                            element={<EditDinnerPage />}
                        />

                        <Route
                            path="/middag/:dinnerId/rating/:ratingId/rediger"
                            element={<EditRatingPage />}
                        />

                        <Route
                            path="/middag/:dinnerId/rating/ny"
                            element={<AddRatingPage />}
                        />

                        {currentUser?.isAdmin && (
                            <>
                                <Route
                                    path="/middag/ny"
                                    element={<NewDinnerPage />}
                                />

                                <Route
                                    path="/admin/ratings"
                                    element={<AdminRatingsPage />}
                                />
                            </>
                        )}
                    </Route>
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
};

export default App;
