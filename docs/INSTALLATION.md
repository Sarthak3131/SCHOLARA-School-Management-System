# SCHOLARA Installation Guide

## Windows prerequisites

Install Node.js/npm, Git and either MongoDB Community Server or access to MongoDB Atlas. Start MongoDB before running the API when using a local URI.

## Clone and install

```powershell
git clone https://github.com/Sarthak3131/SCHOLARA-School-Management-System.git
Set-Location SCHOLARA-School-Management-System
Set-Location server
npm install
Copy-Item .env.example .env
Set-Location ..\client
npm install
```

## Environment

Create `server/.env` from `server/.env.example`:

| Variable | Purpose |
|---|---|
| `PORT` | Express listening port, normally `5000`. |
| `NODE_ENV` | `development`, `test` or `production`. |
| `MONGODB_URI` | Local or Atlas MongoDB connection string. |
| `JWT_SECRET` | Strong secret of at least 32 characters. |
| `JWT_EXPIRES_IN` | JWT lifetime, such as `7d`. |
| `CLIENT_URL` | Allowed frontend origin, such as `http://localhost:5173`. |
| `COOKIE_SECURE` | Set `true` when cookies must be sent only over HTTPS. |

Never commit `.env` or replace the example placeholder with a real secret.

## Start the application

```powershell
# Terminal 1
Set-Location server
npm run dev

# Terminal 2
Set-Location client
npm run dev
```

## Seed development data

```powershell
Set-Location server
npm run seed
```

The seed operation is idempotent for the documented demo records and includes administrator, teacher and guardian demo accounts. Use only in a development database.

## Verification

```powershell
Set-Location server
npm test
Set-Location ..\client
npm run test -- --run
npm run build
```

## Troubleshooting

- **MongoDB connection failure:** confirm MongoDB is running and `MONGODB_URI` is correct.
- **JWT startup failure:** provide a non-empty `JWT_SECRET` with at least 32 characters.
- **Frontend API errors:** confirm the API is on port 5000 and `CLIENT_URL` matches the frontend origin.
- **Port conflict:** change `PORT` in `server/.env` and update the Vite proxy if required.
- **Stale login:** use logout or clear the browser's SCHOLARA token storage after changing environment or seed data.
