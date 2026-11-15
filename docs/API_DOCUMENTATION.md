# SCHOLARA REST API

Base URL: `http://localhost:5000/api`. Protected requests use `Authorization: Bearer <JWT>`; the API also supports its HTTP-only auth cookie. All routes return JSON with a `success` flag unless noted.

## Public and authentication

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Health/status response. |
| POST | `/auth/login` | Public | Validate email/password and issue a token. |
| POST | `/auth/register` | Admin | Create a managed user; body includes `name`, `email`, `password`, `role`, optional `phone`. |
| POST | `/auth/logout` | Authenticated | Revoke the current user's token version and expire the cookie. |
| GET | `/auth/me` | Authenticated | Return the current user profile. |
| PATCH | `/auth/change-password` | Authenticated | Change password with `currentPassword` and `newPassword`. |
| GET | `/auth/admin-only` | Admin | RBAC verification endpoint. |

## Students and teachers

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET | `/students` | Admin, Teacher | Search/list students with class and pagination filters. |
| POST | `/students` | Admin | Create a student. |
| GET | `/students/linked` | Guardian | List only the authenticated guardian's linked students. |
| GET | `/students/:id` | Admin, Teacher, linked Guardian | View an authorized student profile. |
| PUT | `/students/:id` | Admin | Update a student. |
| DELETE | `/students/:id` | Admin | Delete/deactivate according to controller behavior. |
| GET | `/teachers` | Admin | List teachers. |
| POST | `/teachers` | Admin | Create a teacher. |
| GET | `/teachers/:id` | Admin, Teacher | View a teacher profile. |
| PUT | `/teachers/:id` | Admin | Update a teacher. |
| DELETE | `/teachers/:id` | Admin | Deactivate/delete a teacher. |
| PATCH | `/teachers/:id/assignments` | Admin | Replace class/section/subject assignments. |

## Academics and attendance

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET/POST | `/academics/classes` | Authenticated / Admin for POST | List or create classes and sections. |
| PUT/DELETE | `/academics/classes/:id` | Admin | Update or delete a class. |
| GET/POST | `/academics/subjects` | Authenticated / Admin for POST | List or create subjects. |
| PUT/DELETE | `/academics/subjects/:id` | Admin | Update or delete a subject. |
| GET | `/academics/guardians` | Admin, Teacher | Guardian lookup. |
| GET | `/academics/guardians/management` | Admin | Guardian management view. |
| GET | `/attendance/options` | Admin, Teacher | Attendance filter/options data. |
| GET | `/attendance/summary` | Admin, Teacher, Guardian | Authorized attendance summary. |
| GET | `/attendance/roster` | Admin, Teacher | Load an authorized class roster. |
| GET | `/attendance` | Admin, Teacher, Guardian | Query attendance history. |
| POST | `/attendance` | Admin, Teacher | Submit attendance statuses. |
| PUT | `/attendance/:id` | Admin, Teacher | Update an authorized attendance record. |

## Examinations and results

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET | `/examinations` | Admin, Teacher, Guardian | List authorized examinations. |
| POST | `/examinations` | Admin | Create an examination with subjects, maximum marks and grading rules. |
| PUT/DELETE | `/examinations/:id` | Admin | Update or delete an examination. |
| GET | `/examinations/:id/roster` | Admin, Teacher | Load an authorized exam roster. |
| GET | `/examinations/results` | Admin, Teacher, Guardian | Query authorized results. |
| POST | `/examinations/results` | Admin, Teacher | Submit server-validated marks. |
| GET | `/examinations/report-card/:studentId` | Admin, Teacher, linked Guardian | Return an authorized report card. |

## Fees

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET/POST | `/fees/structures` | Admin | List or create class fee structures. |
| PUT | `/fees/structures/:id` | Admin | Update a fee structure. |
| GET | `/fees/invoices` | Admin, linked Guardian | List authorized invoices and filters. |
| POST | `/fees/invoices` | Admin | Generate an invoice from server-side fee data. |
| GET | `/fees/invoices/:id/payments` | Admin, linked Guardian | View payment history. |
| POST | `/fees/invoices/:id/payments` | Admin | Record a simulated partial/full payment. |
| GET | `/fees/payments/:paymentId/receipt` | Admin, linked Guardian | View an authorized receipt. |
| GET | `/fees/stats` | Admin | Collection and outstanding statistics. |

## Reports, audit and dashboard

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET | `/dashboard/admin` | Admin | Admin dashboard data. |
| GET | `/reports/students` | Admin | Student totals, distribution and searchable records. |
| GET | `/reports/attendance` | Admin | Attendance counts/rate with date/class/section filters. |
| GET | `/reports/examinations` | Admin | Examination performance aggregates. |
| GET | `/reports/fees` | Admin | Invoice, collection and outstanding aggregates. |
| GET | `/audit` | Admin | Newest-first paginated audit logs with filters. |
| GET | `/audit/:id` | Admin | Read-only audit detail. |

The API does not currently mount a Swagger UI route.
