import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { backendURL } from './common'

export interface Dinner {
    id: number
    host_user_id: number
    participant_ids: number[]
    date: string
    food: string
    film_imdb_url?: string
    film_title?: string
}

const dinnerApi = createApi({
    reducerPath: 'dinnerApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendURL}/dinner`,
    }),
    endpoints: (builder) => ({
        getDinners: builder.query<Dinner[], void>({
            query: () => '/',
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
})

export const {
    useGetDinnersQuery,
    useGetDinnersByHostQuery,
    useGetDinnerByIdQuery,
    usePostDinnerMutation,
    useDeleteDinnerMutation,
} = dinnerApi

export default dinnerApi
