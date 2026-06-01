import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

import { backendUrl } from '@/api/common';

const MAX_MOVIES = 5;

const tmdbMovieSchema = z.object({
    id: z.number(),
    title: z.string(),
    releaseDate: z.string().optional(),
    posterPath: z.string().optional(),
});
type TmdbMovie = z.infer<typeof tmdbMovieSchema>;

const tmdbExternalIds = z.object({
    imdbId: z.string().optional(),
});
type TmdbExternalIds = z.infer<typeof tmdbExternalIds>;

const tmdbApi = createApi({
    reducerPath: 'tmdbApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${backendUrl}/tmdb`,
    }),
    endpoints: (builder) => ({
        searchMovies: builder.query<TmdbMovie[], string>({
            query: (query) => `/search?q=${encodeURIComponent(query)}`,
            transformResponse: (response) =>
                z.array(tmdbMovieSchema).parse(response).slice(0, MAX_MOVIES),
        }),
        getMovieExternalIds: builder.query<TmdbExternalIds, number>({
            query: (movieId) => `/movie/${String(movieId)}/externalIds`,
            transformResponse: (response) => tmdbExternalIds.parse(response),
        }),
    }),
});

export const { useSearchMoviesQuery, useLazyGetMovieExternalIdsQuery } =
    tmdbApi;
export type { TmdbExternalIds, TmdbMovie };
export default tmdbApi;
