# SCHOLARA Architecture

## System boundaries

SCHOLARA is a modular monolith with a React/Vite client and an Express/Mongoose API. The client owns presentation, local form state and navigation. The server is the security and business-rule boundary. MongoDB is the source of truth for users, academic records, attendance, results, fees and audit events.

## Components

- `client/src/App.jsx`: browser routes and role-protected page composition.
- `client/src/context/AuthContext.jsx`: login persistence, current user state and logout cleanup.
- `client/src/services/`: Axios wrappers for backend resources.
- `client/src/components/ui/`: shared cards, forms, tables, modals, badges and stat cards.
- `server/src/app.js`: Express middleware, route mounting, error handling and startup.
- `server/src/routes/`: endpoint paths and role gates.
- `server/src/middleware/auth.js`: JWT verification, active-user lookup, token-version revocation and role authorization.
- `server/src/controllers/`: validation-aware orchestration and MongoDB operations.
- `server/src/models/`: Mongoose schemas, indexes and relationships.

## Authentication flow

1. Login validates credentials and compares the bcrypt hash.
2. The server signs a JWT containing the user identity and token version.
3. The response includes the token and an HTTP-only cookie; the frontend also persists the token for its Axios authorization header.
4. Protected requests verify the signature, load the current user, compare token version and check account status.
5. Logout increments only the authenticated user's `tokenVersion`, expires the cookie and clears frontend storage. Raw JWTs are never stored.

Registration is protected and available only to administrators. JWT startup configuration fails closed when `JWT_SECRET` is absent or shorter than 32 characters.

## Main data flows

### Academic and attendance

Students reference a class, section and guardian. Teacher records contain assigned class/section/subject entries. Attendance writes are checked against those assignments and use a unique `(student, date, session)` index.

### Examinations

An examination references a class and subjects with maximum marks and grading rules. Results reference examination, student and subject. Marks, percentage and grade are calculated and validated server-side; `(examination, student, subject)` is unique.

### Fees

Fee structures define class/term items. Invoices reference students and classes and maintain paid/outstanding amounts. Payments are immutable ledger records with unique references; the fee controller rejects overpayment and reconciles invoice balances.

### Guardian portal

Guardian requests are scoped through the authenticated guardian-to-student relationship on every relevant profile, attendance, result, invoice, payment and receipt request. The frontend selector does not replace backend ownership checks.

## Database relationships

```mermaid
erDiagram
  USER ||--o{ STUDENT : guardians
  USER ||--o| TEACHER : profile
  CLASS ||--o{ STUDENT : contains
  CLASS ||--o{ TEACHER_ASSIGNMENT : assigned
  STUDENT ||--o{ ATTENDANCE : has
  EXAMINATION ||--o{ RESULT : contains
  STUDENT ||--o{ RESULT : receives
  SUBJECT ||--o{ RESULT : measured
  CLASS ||--o{ EXAMINATION : scopes
  FEE_STRUCTURE ||--o{ INVOICE : generates
  STUDENT ||--o{ INVOICE : billed
  INVOICE ||--o{ PAYMENT : receives
  USER ||--o{ AUDIT_LOG : performs
```

Models present in the repository are `User`, `Student`, `Teacher`, `Class`, `Subject`, `Attendance`, `Examination`, `Result`, `FeeStructure`, `Invoice`, `Payment` and `AuditLog`.
