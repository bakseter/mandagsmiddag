import { configureStore } from '@reduxjs/toolkit';

import chatApi from '@/api/chat';
import chatReducer from '@/api/chatSlice';
import dinnerApi from '@/api/dinner';
import ratingApi from '@/api/rating';
import userApi from '@/api/user';

export const store = configureStore({
    reducer: {
        [dinnerApi.reducerPath]: dinnerApi.reducer,
        [ratingApi.reducerPath]: ratingApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        chat: chatReducer,
        [chatApi.reducerPath]: chatApi.reducer,
    },
    middleware: (getDefaultMiddleware) => [
        ...getDefaultMiddleware(),
        dinnerApi.middleware,
        ratingApi.middleware,
        userApi.middleware,
        chatApi.middleware,
    ],
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
