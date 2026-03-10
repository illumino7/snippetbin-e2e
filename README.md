# SnippetBin E2E

A self-hostable, end-to-end encrypted code snippet sharing platform — like Pastebin, but with **zero-knowledge encryption**. The server never sees your plaintext content.

## How It Works

1. **Create** — Write your snippet in a GitHub Gist-style editor with syntax highlighting for 30+ languages and live Markdown preview
2. **Encrypt** — Your content is encrypted client-side using **AES-256-GCM** via the Web Crypto API before it leaves the browser
3. **Share** — Get a short URL with the decryption key in the URL fragment (`#key=...`), which is never sent to the server
4. **Expire** — Snippets auto-expire after a configurable duration (10 min to 1 year)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   React UI  │────▶│   Go API     │────▶│  PostgreSQL  │
│  (Vite/TS)  │     │  (Chi/5050)  │     │  (pg_cron)   │
└──────┬──────┘     └──────┬───────┘     └──────────────┘
       │                   │
       │              ┌────┴─────┐
       │              │          │
       ▼              ▼          ▼
  AES-256-GCM    ┌────────┐ ┌────────┐
  (client-side)  │ MinIO  │ │ Valkey │
                 │  (S3)  │ │(cache) │
                 └────────┘ └────────┘
```

### Backend — Go

| Component | Technology | Purpose |
|-----------|-----------|---------|
| HTTP Router | [chi](https://github.com/go-chi/chi) v5 | Lightweight request routing & middleware |
| Database | [pgx](https://github.com/jackc/pgx) v5 + PostgreSQL | Snippet metadata storage (short URL ↔ UUID mapping) |
| Object Storage | [MinIO](https://github.com/minio/minio-go) v7 (S3-compatible) | Encrypted snippet content via presigned URLs |
| Cache | [Valkey](https://github.com/valkey-io/valkey-glide) (Redis-compatible) | Write-around cache for snippet lookups |
| Rate Limiter | Fixed-window (Valkey-backed) | 20 req/min per IP on write endpoints |
| Cleanup | pg_cron | Scheduled job deletes expired snippets every 5 minutes |
| S3 Lifecycle | MinIO ILM | Objects auto-expire after 365 days |

### Frontend — React

| Component | Technology |
|-----------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Data Fetching | TanStack React Query v5 |
| Encryption | Web Crypto API (AES-256-GCM) |
| Syntax Highlighting | react-syntax-highlighter |
| Markdown | react-markdown + remark-gfm |
| UI Primitives | Radix UI |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/snippets/presigned` | Rate limited | Get a presigned S3 upload URL + UUID |
| `POST` | `/api/snippets` | Rate limited | Register snippet metadata after upload |
| `GET` | `/api/snippets/{short_code}` | Public | Get presigned S3 download URL for a snippet |

### Database Schema

```sql
CREATE TABLE snippets (
    short_url   VARCHAR(10) PRIMARY KEY,
    id          UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_ADDR` | PostgreSQL connection string | — |
| `DB_MAX_OPEN_CONNS` | Max open DB connections | `30` |
| `DB_MAX_IDLE_CONNS` | Max idle DB connections | `30` |
| `DB_MAX_IDLE_TIME` | Max idle time (seconds) | `15` |
| `S3_ENDPOINT` | MinIO/S3 endpoint | — |
| `S3_ACCESS_KEY` | S3 access key | — |
| `S3_SECRET_KEY` | S3 secret key | — |
| `S3_BUCKET` | S3 bucket name | — |
| `S3_USE_SSL` | Enable TLS for S3 | `false` |
| `CACHE_ADDR` | Valkey/Redis host | — |
| `CACHE_PORT` | Valkey/Redis port | `6379` |

---

## Self-Hosting

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- (Optional) [Go 1.25+](https://go.dev/dl/) and [Node.js 20+](https://nodejs.org/) for local development

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/illumino7/snippetbin-e2e.git
cd snippetbin-e2e

# Start all services
docker compose up -d

# Run database migrations (first time only)
# Install golang-migrate: https://github.com/golang-migrate/migrate
export DB_ADDR="postgres://admin:adminpassword@localhost:5432/snippetbin-e2e?sslmode=disable"
migrate -path=./migrate/migrations -database=$DB_ADDR up
```

The application will be available at:

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://localhost:5050](http://localhost:5050) |
| MinIO Console | [http://localhost:9001](http://localhost:9001) |
| Valkey Commander | [http://localhost:8081](http://localhost:8081) |

### Local Development (without Docker for app)

```bash
# 1. Start infrastructure services
docker compose up -d db s3 s3-init valkey

# 2. Set environment variables
export DB_ADDR="postgres://admin:adminpassword@localhost:5432/snippetbin-e2e?sslmode=disable"
export S3_ENDPOINT="localhost:9000"
export S3_ACCESS_KEY="admin"
export S3_SECRET_KEY="adminpassword"
export S3_BUCKET="snippets"
export CACHE_ADDR="localhost"

# 3. Run database migrations
migrate -path=./migrate/migrations -database=$DB_ADDR up

# 4. Start the backend (with hot reload via Air)
air

# 5. Start the frontend (in a separate terminal)
cd web && npm install && npm run dev
```

### Database Migrations

Uses [golang-migrate](https://github.com/golang-migrate/migrate). Common commands:

```bash
# Apply all migrations
make migrate-up

# Rollback last N migrations
make migrate-down N

# Create a new migration
make migration <migration_name>
```

> **Note:** `DB_ADDR` must be set as an environment variable for Makefile targets.

---

## Docker Build

The project provides separate Dockerfiles for the backend and frontend, enabling independent builds and deployments.

### Backend

```bash
docker build -f Dockerfile.backend -t snippetbin-backend .
docker run -p 5050:5050 \
  -e DB_ADDR="postgres://admin:adminpassword@host.docker.internal:5432/snippetbin-e2e?sslmode=disable" \
  -e S3_ENDPOINT="host.docker.internal:9000" \
  -e S3_ACCESS_KEY="admin" \
  -e S3_SECRET_KEY="adminpassword" \
  -e S3_BUCKET="snippets" \
  -e CACHE_ADDR="host.docker.internal" \
  snippetbin-backend
```

### Frontend

```bash
docker build -f Dockerfile.frontend -t snippetbin-frontend ./web
docker run -p 80:80 snippetbin-frontend
```

### Full Stack (Docker Compose)

```bash
# Build and run everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## Project Structure

```
snippetbin-e2e/
├── cmd/api/              # Application entrypoint & HTTP handlers
│   ├── main.go           # Service bootstrap & dependency wiring
│   ├── api.go            # Route definitions & app struct
│   ├── snippet.go        # Snippet CRUD handlers
│   ├── middleware.go      # Security headers & rate limiting
│   ├── health.go         # Health check endpoint
│   └── jsonutills.go     # JSON request/response helpers
├── internal/             # Private application packages
│   ├── cache/            # Valkey cache layer (write-around)
│   ├── db/               # PostgreSQL storage layer
│   ├── env/              # Environment variable helpers
│   ├── ratelimiter/      # Fixed-window rate limiter
│   └── s3/               # MinIO/S3 storage layer
├── migrate/migrations/   # SQL migration files
├── web/                  # React frontend (Vite + TypeScript)
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages (Create, View, About)
│       └── lib/          # Utilities (crypto, language map)
├── docker-compose.yml    # Infrastructure services
├── Makefile              # Migration shortcuts
└── .air.toml             # Hot reload configuration
```

## License

This project is provided as-is for self-hosting and educational purposes.
