import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

import { backendUrl } from '@/api/common';

const messageSchema = z.object({
    id: z.number(),
    senderId: z.number(),
    senderName: z.string(),
    body: z.string(),
    createdAt: z.string(),
});

type Message = z.infer<typeof messageSchema>;

const postMessageSchema = z.object({
    body: z.string(),
});

type PostMessage = z.infer<typeof postMessageSchema>;

const messageApi = createApi({
    reducerPath: 'messageApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/message`,
    }),
    tagTypes: ['Message'],
    endpoints: (builder) => ({
        getMessages: builder.query<Message[], void>({
            query: () => '',
            transformResponse: (response) =>
                z.array(messageSchema).parse(response),
            providesTags: ['Message'],
        }),

        postMessage: builder.mutation<Message, PostMessage>({
            query: (body) => ({
                method: 'POST',
                url: '',
                body: postMessageSchema.parse(body),
            }),
            transformResponse: (response) => messageSchema.parse(response),
            invalidatesTags: ['Message'],
        }),
    }),
});

export const { useGetMessagesQuery, usePostMessageMutation } = messageApi;

export { type Message, type PostMessage };
export default messageApi;
