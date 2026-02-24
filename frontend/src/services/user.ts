import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { backendUrl } from './common';

export interface User {
    id: number;
    email: string;
    name: string;
    isAdmin: boolean;
}

const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/user`,
    }),
    tagTypes: ['User'],
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => '',
            providesTags: ['User'],
        }),

        getCurrentUser: builder.query<User, void>({
            query: () => ({
                url: '',
                method: 'PUT',
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export const { useGetUsersQuery, useGetCurrentUserQuery } = userApi;

export default userApi;
