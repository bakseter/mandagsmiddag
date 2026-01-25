import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Dinner {
	id: number;
	host_user_id: number;
	participant_ids: number[];
	date: string;
	food: string;
	film_imdb_url?: string;
	film_title?: string;
}

const hostname = import.meta.env.VITE_HOSTNAME || 'backend';

export const api = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		baseUrl: `http://${hostname}/api/`,
	}),
	endpoints: (builder) => ({
		getDinners: builder.query<Dinner[], void>({
			query: () => 'dinner',
		}),
		getDinnersByHost: builder.query<Dinner[], number>({
			query: (hostId) => `dinner/host/${hostId}`,
		}),
		getDinnerById: builder.query<Dinner, number>({
			query: (dinnerId) => `dinner/${dinnerId}`,
		}),
		postDinner: builder.mutation<void, Dinner>({
			query: (dinner) => ({
				url: 'dinner',
				method: 'POST',
				body: dinner,
			}),
		}),
	}),
});

export const {
	useGetDinnersQuery,
	useGetDinnersByHostQuery,
	useGetDinnerByIdQuery,
	usePostDinnerMutation,
} = api;
