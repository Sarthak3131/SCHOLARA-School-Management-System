# SCHOLARA — School Management System

> Premium School Management System built as a full-stack MERN application.
> Built for ALGIONS AI LABS internship assessment.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Auth | JWT + bcryptjs + Cookie-based sessions |
| Testing | Vitest, React Testing Library, Jest, Supertest |
| Docs | Swagger / OpenAPI |

## Project Structure

```
Algions/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # React context (Auth, etc.)
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Route-level page components
│       ├── services/    # Axios API services
│       ├── styles/      # Global CSS & design tokens
│       └── utils/       # Constants & helpers
│
├── server/          # Node.js + Express backend
│   └── src/
│       ├── config/      # DB connection, env
│       ├── controllers/ # Route handlers
│       ├── middleware/  # Auth, error handling
│       ├── models/      # Mongoose schemas
│       ├── routes/      # Express routers
│       ├── utils/       # Helpers
│       └── validators/  # Input validation
│
└── PROJECT_PROGRESS.md
```

## Quick Start

```bash
# 1. Clone and enter the project
cd Algions

# 2. Backend setup
cd server
cp .env.example .env        # Edit with your MongoDB URI and JWT secret
npm install
npm run dev

# 3. Frontend setup (new terminal)
cd client
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:5000/api/health

## Demo Credentials (Phase 3+)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@scholara.edu | Admin@123 |
| Teacher | teacher@scholara.edu | Teacher@123 |
| Guardian | guardian@scholara.edu | Guardian@123 |

## Documentation

- API Docs (Swagger): http://localhost:5000/api/docs *(Phase 12)*
- Architecture: See `PROJECT_PROGRESS.md`
- DB Schema: See `docs/schema.md` *(Phase 12)*

## License

ALGIONS AI LABS PRIVATE LIMITED — Internal Assessment Project
