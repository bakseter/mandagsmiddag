import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

import { backendUrl } from '@/api/common';

const penaltyInputSchema = z.object({
    userId: z.number(),
    points: z.number().int(),
    reason: z.string(),
});

type PenaltyInput = z.infer<typeof penaltyInputSchema>;

const penaltyApi = createApi({
    reducerPath: 'penaltyApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/penalty`,
    }),
    tagTypes: ['Penalty'],
    endpoints: (builder) => ({
        postPenalty: builder.mutation<void, PenaltyInput>({
            query: (body) => ({
                method: 'POST',
                url: '',
                body: penaltyInputSchema.parse(body),
            }),
            invalidatesTags: ['Penalty'],
        }),
    }),
});

export const { usePostPenaltyMutation } = penaltyApi;
export { type PenaltyInput };
export default penaltyApi;
