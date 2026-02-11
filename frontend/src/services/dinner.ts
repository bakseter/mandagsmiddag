import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { backendUrl } from './common';

export interface Dinner {
    id: number;
    hostUserId: number;
    participantIds?: number[];
    date: string;
    food?: string;
    filmImdbUrl?: string;
    filmTitle?: string;
}

const dinnerApi = createApi({
    reducerPath: 'dinnerApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/dinner`,
    }),
    endpoints: (builder) => ({
        getDinners: builder.query<Dinner[], void>({
            query: () => '',
        }),

        getDinnersByHost: builder.query<Dinner[], number>({
            query: (hostId) => `/host/${hostId}`,
        }),

        getDinnerById: builder.query<Dinner, number>({
            query: (dinnerId) => `/${dinnerId}`,
        }),

        postDinner: builder.mutation<void, Dinner>({
            query: (dinner) => ({
                method: 'POST',
                body: dinner,
            }),
        }),

        deleteDinner: builder.mutation<void, number>({
            query: (dinnerId) => ({
                method: 'DELETE',
                url: `/${dinnerId}`,
            }),
        }),
    }),
});

export const {
    useGetDinnersQuery,
    useGetDinnersByHostQuery,
    useGetDinnerByIdQuery,
    usePostDinnerMutation,
    useDeleteDinnerMutation,
} = dinnerApi;

export default dinnerApi;
