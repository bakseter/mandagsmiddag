# mandagsmiddag

Dinner on a monday.

## Local setup

Prerequisites:

- Docker
- Bun

### Frontend

Run the frontend like this:

```bash
cd frontend
bun install
bun dev
```

### Backend

Run the backend and database like this:

```bash
cd backend
docker compose up --build backend database
```

You can reset the database like this:

```bash
docker compose down
```

#### TMDB API Read Access Token

The backend also queries The Movie Database (TMDB) API. You need an "API Read Access Token" for this.

1. Create an account at https://www.themoviedb.org and follow [this guide](https://developer.themoviedb.org/docs/getting-started).

2. Create a file called `.env` in `backend/`:

```env
# backend/.env
TMDB_API_READ_ACCESS_TOKEN=<your api token here>
```

3. Run the backend like normal.

#### OTEL debugging

The compose file for the backend also contains an OpenTelemetry Collector for debugging signals sent from the backend.
We currently send logs and traces via OTEL.

To run the OpenTelemetry Collector alongside the backend, run this:

```bash
docker compose up --build
```
