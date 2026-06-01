import { configureStore } from '@reduxjs/toolkit';

import dinnerApi from '@/api/dinner';
import penaltyApi from '@/api/penalty';
import ratingApi from '@/api/rating';
import tmdbApi from '@/api/tmdb';
import userApi from '@/api/user';

export const store = configureStore({
    reducer: {
        [dinnerApi.reducerPath]: dinnerApi.reducer,
        [penaltyApi.reducerPath]: penaltyApi.reducer,
        [ratingApi.reducerPath]: ratingApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [tmdbApi.reducerPath]: tmdbApi.reducer,
    },
    middleware: (getDefaultMiddleware) => [
        ...getDefaultMiddleware(),
        dinnerApi.middleware,
        penaltyApi.middleware,
        ratingApi.middleware,
        userApi.middleware,
        tmdbApi.middleware,
    ],
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
