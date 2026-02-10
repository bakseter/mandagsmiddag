import { configureStore } from "@reduxjs/toolkit";
import dinnerApi from "../services/dinner";
import ratingApi from "../services/rating";

export const store = configureStore({
  reducer: {
    [dinnerApi.reducerPath]: dinnerApi.reducer,
    [ratingApi.reducerPath]: ratingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
        dinnerApi.middleware,
        ratingApi.middleware
    ),
});

// Types (important for TS)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
