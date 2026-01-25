import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Dinner {
	id: number;
	title: string;
	// add other fields as needed
}

const hostname = import.meta.env.VITE_HOSTNAME;

export const api = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		baseUrl: `https://${hostname}/api/`,
	}),
	endpoints: (builder) => ({
		getDinners: builder.query<Dinner[], void>({
			query: () => 'dinner/',
		}),
	}),
});

export const { useGetDinnersQuery } = api;
