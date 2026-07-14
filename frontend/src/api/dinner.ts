import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

import { backendUrl } from '@/api/common';

const dinnerSchema = z.object({
    id: z.number(),
    hostUserId: z.number(),
    participantIds: z.array(z.number()).optional(),
    date: z.string(),
    food: z.string().optional(),
    filmImdbUrl: z.string().optional(),
    filmTitle: z.string().optional(),
});

type Dinner = z.infer<typeof dinnerSchema>;

const dinnerApi = createApi({
    reducerPath: 'dinnerApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/dinner`,
    }),
    tagTypes: ['Dinner'],
    endpoints: (builder) => ({
        getDinners: builder.query<Dinner[], void>({
            query: () => '',
            transformResponse: (response) =>
                z.array(dinnerSchema).parse(response),
            providesTags: ['Dinner'],
        }),

        getDinnersByHost: builder.query<Dinner[], number>({
            query: (hostId) => `/host/${String(hostId)}`,
            transformResponse: (response) =>
                z.array(dinnerSchema).parse(response),
            providesTags: ['Dinner'],
        }),

        getDinnerById: builder.query<Dinner, number>({
            query: (dinnerId) => `/${String(dinnerId)}`,
            transformResponse: (response) => dinnerSchema.parse(response),
            providesTags: ['Dinner'],
        }),

        putDinner: builder.mutation<void, Dinner>({
            query: (body) => ({
                method: 'PUT',
                url: ``,
                body: dinnerSchema.parse(body),
            }),
            invalidatesTags: ['Dinner'],
        }),

        deleteDinner: builder.mutation<void, number>({
            query: (dinnerId) => ({
                method: 'DELETE',
                url: `/${String(dinnerId)}`,
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

export { type Dinner };
export default dinnerApi;
