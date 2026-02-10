import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Dinner {
  id: number;
  host_user_id: number;
  participant_ids: number[];
  date: string;
  food: string;
  film_imdb_url?: string;
  film_title?: string;
}

const backendURL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api";

const dinnerApi = createApi({
  reducerPath: "dinnerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${backendURL}/dinner`,
  }),
  endpoints: (builder) => ({
    getDinners: builder.query<Dinner[], void>({
      query: () => "/",
    }),

    getDinnersByHost: builder.query<Dinner[], number>({
      query: (hostId) => `/host/${hostId}`,
    }),

    getDinnerById: builder.query<Dinner, number>({
      query: (dinnerId) => `/${dinnerId}`,
    }),

    postDinner: builder.mutation<void, Dinner>({
      query: (dinner) => ({
        method: "POST",
        body: dinner,
      }),
    }),
  }),
});

export const {
  useGetDinnersQuery,
  useGetDinnersByHostQuery,
  useGetDinnerByIdQuery,
  usePostDinnerMutation,
} = dinnerApi;

export default dinnerApi;
