import { configureStore } from '@reduxjs/toolkit';
import { dinnerAPI } from '../services/dinner';

export const store = configureStore({
	reducer: {
		[dinnerAPI.reducerPath]: dinnerAPI.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(dinnerAPI.middleware),
});

// Types (important for TS)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
