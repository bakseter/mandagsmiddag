import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { backendUrl } from './common'

export interface User {
    ID: number
    Email: string
}

const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/user`,
    }),
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => '/',
        }),

        putUser: builder.mutation<void, void>({
            query: () => '/',
            method: 'PUT',
        }),
    }),
})

export const { useGetUsersQuery, usePutUserMutation } = userApi

export default userApi
