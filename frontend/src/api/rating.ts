import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

import { backendUrl } from '@/api/common';

const ratingSchema = z.object({
    id: z.number(),
    userId: z.number(),
    filmScore: z.number(),
    dinnerScore: z.number().nullable(),
    dinnerId: z.number(),
});

type Rating = z.infer<typeof ratingSchema>;

const ratingApi = createApi({
    reducerPath: 'ratingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/rating`,
    }),
    tagTypes: ['Rating'],
    endpoints: (builder) => ({
        getRatings: builder.query<Rating[], void>({
            query: () => '',
            transformResponse: (response) =>
                z.array(ratingSchema).parse(response),
            providesTags: ['Rating'],
        }),

        getRatingsByUser: builder.query<Rating[], void>({
            query: () => `/user`,
            transformResponse: (response) =>
                z.array(ratingSchema).parse(response),
            providesTags: ['Rating'],
        }),

        getRatingById: builder.query<Rating, number>({
            query: (ratingId) => `/${String(ratingId)}`,
            transformResponse: (response) => ratingSchema.parse(response),
            providesTags: ['Rating'],
        }),

        putRating: builder.mutation<void, Rating>({
            query: (body) => ({
                method: 'PUT',
                url: '',
                body: ratingSchema.parse(body),
            }),
            invalidatesTags: ['Rating'],
        }),

        deleteRating: builder.mutation<void, number>({
            query: (ratingId) => ({
                method: 'DELETE',
                url: `/${String(ratingId)}`,
            }),
            invalidatesTags: ['Rating'],
        }),
    }),
});

export const {
    useGetRatingsQuery,
    useGetRatingsByUserQuery,
    useGetRatingByIdQuery,
    usePutRatingMutation,
    useDeleteRatingMutation,
} = ratingApi;

export { type Rating };
export default ratingApi;
