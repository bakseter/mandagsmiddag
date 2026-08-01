import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

import { backendUrl } from '@/api/common';

const penaltySchema = z.object({
    id: z.number(),
    userId: z.number(),
    points: z.number(),
    reason: z.string(),
    assignedBy: z.string(),
    assignedAt: z.string(),
});

type Penalty = z.infer<typeof penaltySchema>;

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
        getPenalties: builder.query<Penalty[], void>({
            query: () => '',
            transformResponse: (response) =>
                z.array(penaltySchema).parse(response),
            providesTags: ['Penalty'],
        }),

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

export const { useGetPenaltiesQuery, usePostPenaltyMutation } = penaltyApi;
export { type Penalty, type PenaltyInput };
export default penaltyApi;
