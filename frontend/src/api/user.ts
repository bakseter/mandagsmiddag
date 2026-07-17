import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

import { backendUrl } from '@/api/common';

const userSchema = z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
    isAdmin: z.boolean().default(false),
});

type User = z.infer<typeof userSchema>;

const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/user`,
    }),
    tagTypes: ['User'],
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => '',
            transformResponse: (response) =>
                z.array(userSchema).parse(response),
            providesTags: ['User'],
        }),

        getCurrentUser: builder.query<User, void>({
            query: () => ({
                url: '',
                method: 'PUT',
            }),
            transformResponse: (response) => userSchema.parse(response),
        }),
    }),
});

export const { useGetUsersQuery, useGetCurrentUserQuery } = userApi;
export { type User };

export default userApi;
