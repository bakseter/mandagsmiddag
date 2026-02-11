import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { backendUrl } from './common';

export interface User {
    ID: number;
    Email: string;
    Name: string;
    IsAdmin: boolean;
}

const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/user`,
    }),
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => '',
        }),

        getCurrentUser: builder.query<User, void>({
            query: () => ({
                url: '',
                method: 'PUT',
            }),
        }),
    }),
});

export const { useGetUsersQuery, useGetCurrentUserQuery } = userApi;

export default userApi;
