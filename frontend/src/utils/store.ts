import { configureStore } from '@reduxjs/toolkit'
import dinnerApi from '../services/dinner'
import ratingApi from '../services/rating'
import userApi from '../services/user'

export const store = configureStore({
    reducer: {
        [dinnerApi.reducerPath]: dinnerApi.reducer,
        [ratingApi.reducerPath]: ratingApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            dinnerApi.middleware,
            ratingApi.middleware,
            userApi.middleware
        ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
