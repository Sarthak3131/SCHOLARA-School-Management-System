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

For the Vite frontend, optionally create `client/.env` from `client/.env.example`.
Leave `VITE_API_URL` empty during local development so the Vite `/api` proxy targets
`http://localhost:5000`. For Vercel, set it to the deployed backend API base URL:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

`VITE_*` values are public browser configuration; never put secrets in them.

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

## Production deployment preparation

### MongoDB Atlas

1. Create a MongoDB Atlas project, database user and database.
2. Configure network access for the deployed Render service. Prefer a restricted
   network policy appropriate to your hosting plan; do not commit the connection
   string.
3. Set Render's `MONGODB_URI` to the Atlas connection string.
4. Do not run `npm run seed` against production unless demo data is intentionally
   required. The seed script is for controlled development/demo provisioning.

### Render backend

Create a Web Service using the repository's `server` directory as the root:

| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Set these Render environment variables:

```text
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<random secret of at least 32 characters>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-vercel-project.vercel.app
COOKIE_SECURE=true
```

Use the exact final Vercel origin for `CLIENT_URL`, including `https://` and
excluding a trailing slash. The API accepts Bearer authorization headers and
retains its existing RBAC and token-revocation behavior.

### Vercel frontend

Create a Vercel project using the repository's `client` directory as the root:

| Setting | Value |
|---|---|
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |

Set this Vercel environment variable for the production environment:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

Do not replace the placeholder with a real service URL in committed files. The
included `client/vercel.json` sends non-API paths to `index.html`, allowing
React Router refreshes while excluding `/api` from the SPA fallback. Because the
production API URL is absolute, API requests are not routed to the frontend
fallback.

### Deployment order

1. Provision MongoDB Atlas and configure the Render environment.
2. Deploy the Render backend and verify `/api/health`.
3. Configure `VITE_API_URL` with the Render API base URL and deploy the Vercel frontend.
4. Update Render `CLIENT_URL` to the final Vercel origin if it changed.
5. Verify login, logout revocation, role restrictions and nested route refreshes.

## Troubleshooting

- **MongoDB connection failure:** confirm MongoDB is running and `MONGODB_URI` is correct.
- **JWT startup failure:** provide a non-empty `JWT_SECRET` with at least 32 characters.
- **Frontend API errors:** confirm the API is on port 5000 and `CLIENT_URL` matches the frontend origin.
- **Port conflict:** change `PORT` in `server/.env` and update the Vite proxy if required.
- **Stale login:** use logout or clear the browser's SCHOLARA token storage after changing environment or seed data.
