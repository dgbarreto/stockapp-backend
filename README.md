# stockapp-backend

NestJS API for [StockApp](https://github.com/dgbarreto/stockapp-app) — an investment tracking app (learning project). Integrates the [bolsai](https://www.usebolsai.com/) market data API, owns authentication, and persists the user's portfolio (positions and orders).

## Modules

- **`auth`** — registration/login (Passport.js, JWT strategy, `bcrypt` password hashing), `JwtAuthGuard` protecting the routes below.
- **`quotes`** — proxies bolsai's stock fundamentals endpoint (`GET /quotes/:ticker`) and persists a time-series history (`GET /quotes/:ticker/history`) in TimescaleDB.
- **`fiis`** — same idea as `quotes`, for REITs (FIIs): a dedicated bolsai endpoint with different indicators (P/VP, 12-month dividend yield, book value per share, shareholders, etc.), stored separately (`FiiSnapshot`, not `QuoteSnapshot`).
- **`positions`** — read-only aggregation: `GET /positions` and `GET /positions/summary`, which joins the user's positions with the current price (via `quotes`/`fiis`) and, when available, a ticker logo hosted on Google Cloud Storage. All writes to a position now happen through `orders` (see below).
- **`orders`** — buy/sell order CRUD. `Order` is the single source of truth for the portfolio: every create/update/delete recalculates the corresponding `Position` from scratch, inside a database transaction (a sale that would exceed the current quantity is rejected automatically).
- **`users`** — user records backing `auth`.

## Data

- **PostgreSQL + TimescaleDB** (hosted on Timescale Cloud in production) — the relational domain (users, positions, orders) plus a hypertable for quote/FII history.
- **Prisma** as ORM/migrations, with the repository pattern implemented by hand on top of it.
- **Google Cloud Storage** — public bucket serving ticker logos (`{TICKER}.png`), used by `positions`' aggregation to resolve avatar URLs.
- **Redis** — planned for a future phase (quote caching + price-alert pub/sub), not wired in yet.

## Deployment

Deployed to **Google Cloud Run**, container images published to **Artifact Registry**. CI/CD (GitHub Actions) builds and deploys automatically on every version tag, authenticating via **Workload Identity Federation** (no static service-account keys), and runs `prisma migrate deploy` against the production database before rolling out.

## Stack

- NestJS · TypeScript · Prisma 7 · PostgreSQL + TimescaleDB · Passport.js (JWT) · Docker · Google Cloud Run / Artifact Registry / Cloud Storage · GitHub Actions

## Project setup

```bash
npm install
```

## Running

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Tests

```bash
npm run test        # unit tests
npm run test:e2e    # e2e tests
npm run test:cov    # coverage
```

## Environment

Copy `.env.example` to `.env` and fill in `DATABASE_URL` (Postgres/TimescaleDB), `JWT_SECRET`/`JWT_EXPIRES_IN`, and `BOLSAI_API_KEY`.

---

_Progress kept up to date manually as the project moves forward._
