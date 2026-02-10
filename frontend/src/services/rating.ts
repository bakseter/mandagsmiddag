import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Rating {
  id: number;
  user_id: number;
  film_score: number;
  dinner_score: number;
  dinner_id: number;
}

const backendURL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api";

const ratingApi = createApi({
  reducerPath: "ratingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${backendURL}/rating`,
  }),
  endpoints: (builder) => ({
    getRatings: builder.query<Rating[], void>({
      query: () => "/",
    }),

    getRatingsByUser: builder.query<Rating[], number>({
      query: (userId) => `/host/${userId}`,
    }),

    getRatingById: builder.query<Rating, number>({
      query: (ratingId) => `/${ratingId}`,
    }),

    postRating: builder.mutation<void, Rating>({
      query: (rating) => ({
        method: "POST",
        body: rating,
      }),
    }),
  }),
});

export const {
  useGetRatingsQuery,
  useGetRatingsByUserQuery,
  useGetRatingByIdQuery,
  usePostRatingMutation,
} = ratingApi;

export default ratingApi;
