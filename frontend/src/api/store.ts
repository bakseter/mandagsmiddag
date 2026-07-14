import { configureStore } from '@reduxjs/toolkit';

import dinnerApi from '@/api/dinner';
import ratingApi from '@/api/rating';
import userApi from '@/api/user';

export const store = configureStore({
    reducer: {
        [dinnerApi.reducerPath]: dinnerApi.reducer,
        [ratingApi.reducerPath]: ratingApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
    },
    middleware: (getDefaultMiddleware) => [
        ...getDefaultMiddleware(),
        dinnerApi.middleware,
        ratingApi.middleware,
        userApi.middleware,
    ],
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
