# Acowale CRM Machine Test by Itisha Jain

**Loop** — a lightweight customer feedback platform. Customers submit feedback through a
public form; the team analyses trends through a private admin dashboard.

> Built for the Acowale Software Engineer Machine Test.
> **Live app:** _(added after deployment)_ · **Batch ID:** 6783

---

## ✨ Features

**Public feedback form**
- Submit feedback with a category, free-text comment, optional star rating and optional email
- Fully anonymous submissions supported
- Client + server validation, spam rate-limiting

**Admin dashboard ("Loop")**
- Total feedback, average rating, categories used, last-7-days count
- Category distribution (donut) + submission trend (7-day area chart)
- Searchable, category-filterable, paginated feedback table
- JWT-protected admin login

**Backend APIs**
| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | `/api/feedback` | public | Submit feedback (rate-limited) |
| GET | `/api/feedback` | admin | List feedback (filter/search/paginate) |
| GET | `/api/analytics` | admin | Dashboard summary |
| POST | `/api/auth/login` | public | Admin login → JWT |
| GET | `/api/health` | public | Health + DB connectivity check |

---

## 🧱 Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite + TypeScript, Tailwind CSS v4, Recharts |
| Backend | Node + Express + TypeScript |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Logging | pino / pino-http |

See [`DECISIONS.md`](./DECISIONS.md) for the reasoning behind each choice.

---

## 🚀 Getting Started (local)

### Prerequisites
- Node.js 20+
- A PostgreSQL database (a free [Neon](https://neon.tech) project works well)

### 1. Backend
```bash
cd server
cp .env.example .env        # then fill in DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install
npm run db:migrate          # create tables
npm run db:seed             # create admin user + sample feedback
npm run dev                 # http://localhost:4000
```

### 2. Frontend
```bash
cd client
cp .env.example .env        # leave VITE_API_URL empty for local (Vite proxies /api)
npm install
npm run dev                 # http://localhost:5173
```

### Default admin credentials
Set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` before seeding.
Defaults: `admin@acowale.com` / `Acowale@2026` (change these).

---

## 🔧 Environment Variables

**server/.env**
| Var | Description |
|-----|-------------|
| `DATABASE_URL` | Postgres pooled connection (app runtime) |
| `DIRECT_URL` | Postgres direct connection (Prisma migrations) |
| `JWT_SECRET` | Secret for signing admin JWTs |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |
| `PORT` | API port (default 4000) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed admin credentials |
| `LOG_LEVEL` | pino log level |

**client/.env**
| Var | Description |
|-----|-------------|
| `VITE_API_URL` | Backend base URL (empty in dev; deployed API URL in prod) |

---

## 📁 Project Structure
```
.
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/        # FeedbackForm, Login, Dashboard
│       ├── components/   # Logo, CategoryChart, TrendChart
│       └── lib/          # typed API client
├── server/          # Express + TypeScript API
│   ├── src/
│   │   ├── routes/       # feedback, analytics, auth, health
│   │   ├── middleware/   # auth, rate limiting, error handling
│   │   └── lib/          # prisma, logger, zod schemas
│   └── prisma/           # schema + seed
├── DECISIONS.md     # engineering decision log
└── README.md
```

---

## 🛠️ Production Readiness
- Environment-variable driven config (fails fast if required vars are missing)
- Central error handling with safe client messages
- Zod validation on all write endpoints
- Structured request/error logging (pino)
- `/api/health` endpoint with DB connectivity check
- Rate limiting on public submit + admin login
- JWT authentication for all admin routes

---

## 🧭 Notes
The answers to the assignment's engineering questions live in [`DECISIONS.md`](./DECISIONS.md).
A short write-up on testable code design is in [`TEACH_US.md`](./TEACH_US.md).

## 🧪 Tests & CI
```bash
cd server
npm test          # run once
npm run test:watch
```
Every push/PR to `main` runs [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):
type-checks + unit tests for the server, type-check + build for the client.
