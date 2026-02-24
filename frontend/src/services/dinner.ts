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
    tagTypes: ['Dinner'],
    endpoints: (builder) => ({
        getDinners: builder.query<Dinner[], void>({
            query: () => '',
            providesTags: ['Dinner'],
        }),

        getDinnersByHost: builder.query<Dinner[], number>({
            query: (hostId) => `/host/${hostId}`,
            providesTags: ['Dinner'],
        }),

        getDinnerById: builder.query<Dinner, number>({
            query: (dinnerId) => `/${dinnerId}`,
            providesTags: ['Dinner'],
        }),

        putDinner: builder.mutation<void, Dinner>({
            query: (dinner) => ({
                method: 'PUT',
                body: dinner,
            }),
            invalidatesTags: ['Dinner'],
        }),

        deleteDinner: builder.mutation<void, number>({
            query: (dinnerId) => ({
                method: 'DELETE',
                url: `/${dinnerId}`,
            }),
            invalidatesTags: ['Dinner'],
        }),
    }),
});

export const {
    useGetDinnersQuery,
    useGetDinnersByHostQuery,
    useGetDinnerByIdQuery,
    usePutDinnerMutation,
    useDeleteDinnerMutation,
} = dinnerApi;

export default dinnerApi;
