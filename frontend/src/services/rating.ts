import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { backendUrl } from './common'

export interface Rating {
    id: number
    user_id: number
    film_score: number
    dinner_score: number
    dinner_id: number
}

const ratingApi = createApi({
    reducerPath: 'ratingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/rating`,
    }),
    endpoints: (builder) => ({
        getRatings: builder.query<Rating[], void>({
            query: () => '/',
        }),

        getRatingsByUser: builder.query<Rating[], number>({
            query: (userId) => `/host/${userId}`,
        }),

        getRatingById: builder.query<Rating, number>({
            query: (ratingId) => `/${ratingId}`,
        }),

        postRating: builder.mutation<void, Rating>({
            query: (rating) => ({
                method: 'POST',
                body: rating,
            }),
        }),
    }),
})

export const {
    useGetRatingsQuery,
    useGetRatingsByUserQuery,
    useGetRatingByIdQuery,
    usePostRatingMutation,
} = ratingApi

export default ratingApi
