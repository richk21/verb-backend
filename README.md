# Verb — Backend

Express/TypeScript API for Verb, an internal engineering incident
reporting and review platform. Handles authentication, role-based access
control, organization (tenant) isolation, the incident review workflow,
automatic secret scanning on submissions, and an immutable audit trail.

Frontend repo: `<link to your verb frontend repo>`

---

## What this API does

- **Multi-tenant organizations.** Every user and report belongs to an
  organization (`orgId`). Every report query is scoped by it, and
  cross-tenant lookups return `404` (not `403`) so a request can't be used
  to confirm another org's data exists.
- **Role-based access control.** Four roles — `contributor`, `reviewer`,
  `auditor`, `admin` — enforced server-side via middleware
  (`requireRole`), not just hidden in the UI.
- **Review workflow.** Reports move through
  `draft → under_review → approved → published`, with a send-back-for-
  changes path (`under_review → draft`) and inline reviewer comments.
- **Secret scanning.** Every report save/update is scanned for
  accidentally-pasted AWS keys, private key blocks, database connection
  strings, and internal IP addresses before it's written to the database.
  Lightweight and regex-based — not a replacement for a dedicated tool
  like GitGuardian or Gitleaks in a real deployment.
- **Immutable audit trail.** Every meaningful mutation is recorded in an
  append-only `AuditLog` collection. No update or delete route exists for
  it anywhere in the codebase — readable only by `auditor`/`admin` roles.

---

## Tech stack

Node.js, Express, TypeScript, MongoDB (Mongoose), JWT + Google OAuth,
Jest/ts-jest, Swagger/OpenAPI.

---

## Getting started

```bash
yarn install
cp .env.example .env   # fill in the values below
yarn dev
```

### Environment variables

| Variable                                                                 | Purpose                                        |
| ------------------------------------------------------------------------ | ---------------------------------------------- |
| `PORT`                                                                   | Port the API listens on                        |
| `MONGO_URI`                                                              | MongoDB connection string                      |
| `FRONTEND_URL`                                                           | Used for CORS and links in verification emails |
| `JWT_SECRET`                                                             | Signing secret for auth tokens                 |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cover-image uploads                            |
| `UNSPLASH_ACCESS_KEY`                                                    | Stock cover-image search                       |
| `RESEND_API_KEY`                                                         | Transactional email (signup verification)      |

### Scripts

```bash
yarn dev              # local dev server (nodemon)
yarn build             # compile TypeScript to dist/
yarn start             # run compiled build
yarn test              # run Jest suite
yarn test:coverage     # with coverage report
```

### API docs

Swagger UI is served at `/api-docs` once the server is running.

---

## Signup / organizations

New accounts must supply an `organizationName` on signup. If the name
doesn't exist yet, the new account becomes that organization's first
`admin`; if it already exists, the new account joins as a `contributor`.
There is currently no endpoint for an `admin` to change another member's
role after signup — see [Known gaps](#known-gaps--next-steps).

---

## Roles

| Role          | Can do                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `contributor` | Create/edit their own reports, submit for review                                                                  |
| `reviewer`    | Approve, request changes (with a required comment), give final publish sign-off, add non-blocking review comments |
| `auditor`     | Read-only, including the audit log endpoint                                                                       |
| `admin`       | Everything a reviewer can, plus (planned) role management                                                         |

---

## Key middleware

- `authMiddleware` — verifies the JWT, attaches `req.user` (`id`, `email`,
  `name`, `role`, `orgId`).
- `requireRole(...roles)` — 403s unless `req.user.role` is in the allowed
  list. Composed with `authMiddleware`, not merged into it.
- `complianceScanner` — regex-scans `req.body` for secret-shaped strings
  before the request reaches its controller; blocks with `400` and a list
  of matched pattern _labels_ (never the matched text itself).

---

## Known gaps / next steps

- **Admin role-management endpoint** — `AuditAction` already has a
  `user.role_changed` case defined, but nothing calls it yet.
- **Test coverage** — only the secret-scanning utility has automated
  tests today. RBAC middleware, org-scoping (cross-tenant 404 behavior),
  and the review-workflow state transitions have no tests yet.
- **`complianceScanner` isn't applied to `/reports/request-changes`** —
  free-text reviewer comments currently bypass the secret scan that
  report content goes through.
- **Infrastructure** — no Dockerfile/docker-compose, no CI pipeline yet.
  Logging is `console.*` throughout; no Winston. No Redis caching.
- **Auth hardening** — JWTs are returned in the response body today,
  not set as an HTTP-only cookie.
- **Minor bug**: `Report.reviewerComments` schema has a typo —
  `createdAT` should be `createdAt`.

---

## Security notes

This is a learning/portfolio project reimplementing simplified versions
of patterns found in real tools (GitGuardian-style secret scanning,
incident.io-style review workflow, GRC-style audit trails) to understand
how they work — not a production-audited system. Do not use it to store
real incident data.
