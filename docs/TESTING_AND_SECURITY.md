# Testing and Security

## Commands

```powershell
Set-Location server
npm test

Set-Location ..\client
npm run test -- --run
npm run build
```

## Verified results

Latest completed checkpoints:

- Phase 10 backend: 60/60 tests passed.
- Phase 10 frontend: 30/30 tests passed.
- Phase 11 backend: 66/66 tests passed.
- Phase 11 frontend: 30/30 tests passed.
- Frontend production build: passed.
- Focused Phase 11 authentication/revocation suite: 17/17 passed.

The production build reports only the existing Vite bundle-size warning.

## Security controls

- Passwords are hashed with bcryptjs and excluded from normal User queries/JSON responses.
- JWT signing fails closed if `JWT_SECRET` is absent or shorter than 32 characters.
- Protected routes verify the token, load the active database user and compare a per-user token version.
- Authenticated logout increments that user's token version, immediately invalidating bearer tokens without storing raw JWTs.
- Registration is restricted to administrators; frontend role checks are not the security boundary.
- `authorize` protects administrative, teacher and guardian operations server-side.
- Teacher attendance and marks access is checked against assignments.
- Guardian profile, attendance, results, invoice, payment and receipt access is scoped to linked students.
- Reports and audit logs are administrator-only.
- Attendance and result duplicate constraints are enforced at MongoDB level.
- Fee calculations, marks, grades, balances and overpayment checks are server-side.
- Helmet, restricted-origin CORS, request validation and centralized error handling are enabled.

## Dependency audit

The reviewed npm audits reported no high or critical production vulnerability. Existing low/moderate advisories are concentrated in development/tooling dependencies, including Jest, Vite/esbuild, nodemon and Swagger-related transitive packages. No force upgrade was applied because the available fixes involved incompatible or broad dependency changes; review them before production deployment.

## Known risks and operational guidance

- Use a unique production JWT secret and HTTPS with secure cookies.
- Change/remove seeded demo credentials before production.
- Payments are simulated and are not a payment gateway integration.
- Per-user token-version revocation invalidates all active bearer tokens for that user when one logout occurs.
- No separate student account exists.
- Run dependency audits again before deployment because advisories change over time.
