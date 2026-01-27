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

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

export const dinnerAPI = createApi({
	reducerPath: 'dinner',
	baseQuery: fetchBaseQuery({
		baseUrl: backendURL,
	}),
	endpoints: (builder) => ({
		getDinners: builder.query<Dinner[], void>({
			query: () => '/dinner',
		}),
		getDinnersByHost: builder.query<Dinner[], number>({
			query: (hostId) => `/dinner/host/${hostId}`,
		}),
		getDinnerById: builder.query<Dinner, number>({
			query: (dinnerId) => `/dinner/${dinnerId}`,
		}),
		postDinner: builder.mutation<void, Dinner>({
			query: (dinner) => ({
				url: '/dinner',
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
} = dinnerAPI;
