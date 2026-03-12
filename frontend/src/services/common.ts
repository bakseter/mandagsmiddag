const backendUrl =
    (import.meta.env.VITE_BACKEND_URL as string | undefined | null) ??
    'http://localhost:8080/api';

export { backendUrl };
