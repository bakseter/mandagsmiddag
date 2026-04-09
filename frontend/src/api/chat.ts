import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const chatApi = createApi({
    reducerPath: 'chatApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    endpoints: () => ({}),
});

export default chatApi;
