import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface User {
  ID: number;
  Email: string;
}

const backendURL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api";

const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${backendURL}/user`,
  }),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/",
    }),
  }),
});

export const { useGetUsersQuery } = userApi;

export default userApi;
