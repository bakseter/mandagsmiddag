import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { backendUrl } from './common';

export interface Rating {
    id: number;
    userId: number;
    filmScore: number;
    dinnerScore: number;
    dinnerId: number;
}

const ratingApi = createApi({
    reducerPath: 'ratingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/rating`,
    }),
    tagTypes: ['Rating'],
    endpoints: (builder) => ({
        getRatings: builder.query<Rating[], void>({
            query: () => '',
            providesTags: ['Rating'],
        }),

        getRatingsByUser: builder.query<Rating[], void>({
            query: () => `/user`,
            providesTags: ['Rating'],
        }),

        getRatingById: builder.query<Rating, number>({
            query: (ratingId) => `/${ratingId}`,
            providesTags: ['Rating'],
        }),

        putRating: builder.mutation<void, Rating>({
            query: (rating) => ({
                method: 'PUT',
                url: '',
                body: rating,
            }),
            invalidatesTags: ['Rating'],
        }),

        deleteRating: builder.mutation<void, number>({
            query: (ratingId) => ({
                method: 'DELETE',
                url: `/${ratingId}`,
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

export default ratingApi;
