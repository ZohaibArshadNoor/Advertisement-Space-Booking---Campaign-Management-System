# Advertisement Space Booking & Campaign Management System
### Full Architecture Guide — Flask Backend + Vite/React (JavaScript) Frontend

This document is the single reference for how the project is structured, how to
scaffold both the backend and frontend from empty folders using terminal
commands, and how the 3 team members split ownership so endpoints and screens
don't collide.

---

## 0. Project Overview

This is a booking-and-operations platform for **advertising space** —
billboards, digital screens, transit ads, banners, or website ad slots. It
connects two sides:

- **Advertisers**, who search for available ad space, put together a
  campaign, upload their creative artwork, and pay for it.
- **The agency staff** (sales, space managers, creative reviewers, finance,
  admin), who manage inventory, approve requests, and run the business.

**The core workflow** the whole system is built around:

`Advertiser registers → searches spaces → checks availability → creates a
campaign → gets a quotation → booking is approved → creative is approved →
payment is made → campaign runs → completion/report`

A booking can't be confirmed until approval + payment checks pass, a space
can never be double-booked for overlapping dates, and creative material
can't go live until a reviewer approves it — these three rules are the
backbone of the business logic.

**Six roles** see different slices of the same data: Advertiser, Sales
Executive, Space Manager, Creative Reviewer, Finance Officer, and Admin.
**22 database tables** back the whole thing, covering identity, inventory,
campaigns/bookings, quotations/contracts, creatives, payments, execution
tracking, and reporting/audit — all mapped out in §22 of the original
requirement document.

The end deliverable is a Flask REST API (backend) with a React (Vite,
JavaScript) frontend, deployed with Docker, with role-based dashboards and
PDF/CSV reporting on top.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Flask (Python) |
| Database | PostgreSQL |
| ORM | Flask-SQLAlchemy |
| Migrations | Flask-Migrate |
| Auth | Flask-Login + JWT (for API calls from React) |
| Backend Forms/Validation | Flask-WTF / Marshmallow (for API payloads) |
| Frontend | React 18 (JavaScript, **no TypeScript**), built with **Vite** |
| Routing (frontend) | react-router-dom |
| State management | Redux Toolkit (or Context API — see note in §5) |
| HTTP client | axios |
| Styling | Bootstrap 5 (via `react-bootstrap` or plain CSS import) |
| Charts | Chart.js (via `react-chartjs-2`) |
| PDF | ReportLab / WeasyPrint (backend-generated) |
| Testing | Pytest (backend), Vitest (frontend) |
| Deployment | Docker |

---

## 2. Top-Level Repository Layout

```
adbooking-system/
├── backend/            # Flask API
├── frontend/            # Vite + React app
└── README.md
```

Two independent folders, two independent `git` histories can even be used
(or one monorepo — your call). Everything below assumes this split.

---

## 3. STEP 1 — Create the Frontend with Vite (run this first)

Do **not** hand-build the folder structure first. Always start from the Vite
generator, then layer the architecture on top. Run this in the repo root:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom axios @reduxjs/toolkit react-redux react-bootstrap bootstrap react-hook-form date-fns react-chartjs-2 chart.js
```

This gives you a **working, non-broken** React + JS project (no TypeScript,
since we used the `react` template, not `react-ts`) with a valid
`vite.config.js`, `package.json`, and `index.html` already wired correctly —
this is what avoids the "broken initialization" problem from last time.

Confirm it runs before touching anything else:

```bash
npm run dev
```

---

## 4. Frontend Architecture (feature-based)

Once the Vite project is confirmed working, this is the target structure
**inside** `frontend/src/`:

```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── .env
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── routes/
    │   └── AppRoutes.jsx
    ├── layouts/
    │   ├── MainLayout.jsx
    │   ├── AuthLayout.jsx
    │   └── DashboardLayout.jsx
    ├── components/
    │   ├── common/          # Button, Modal, Table, Pagination, Loader
    │   └── ui/               # small presentational pieces
    ├── services/
    │   └── apiClient.js       # axios instance with baseURL + interceptors
    ├── store/
    │   └── store.js           # Redux Toolkit store
    ├── context/
    │   └── AuthContext.jsx    # current user/role (if not using Redux)
    ├── hooks/
    │   └── useAuth.js
    ├── utils/
    │   └── formatters.js
    ├── assets/
    └── features/
        ├── auth/
        │   ├── pages/         # LoginPage.jsx, RegisterPage.jsx
        │   ├── components/
        │   └── authApi.js
        ├── advertisers/
        ├── spaces/             # catalog + categories + locations
        ├── availability/
        ├── rateCards/
        ├── campaigns/
        ├── bookings/
        ├── quotations/
        ├── creatives/
        ├── contracts/
        ├── payments/
        ├── execution/          # campaign_events (installed/live/removed)
        ├── performance/        # performance_metrics
        ├── notifications/
        ├── complaints/
        ├── dashboard/
        └── admin/
```

Each feature folder is self-contained: its own `pages/`, `components/`, and
an `xApi.js` file that calls the matching Flask blueprint. This is what
lets each teammate work inside their own feature folders without touching
each other's files.

### Scaffold command (run inside `frontend/src/`)

```bash
cd frontend/src

mkdir -p routes layouts components/common components/ui services store context hooks utils assets \
  features/auth/pages features/auth/components \
  features/advertisers/pages features/advertisers/components \
  features/spaces/pages features/spaces/components \
  features/availability/pages features/availability/components \
  features/rateCards/pages features/rateCards/components \
  features/campaigns/pages features/campaigns/components \
  features/bookings/pages features/bookings/components \
  features/quotations/pages features/quotations/components \
  features/creatives/pages features/creatives/components \
  features/contracts/pages features/contracts/components \
  features/payments/pages features/payments/components \
  features/execution/pages features/execution/components \
  features/performance/pages features/performance/components \
  features/notifications/pages features/notifications/components \
  features/complaints/pages features/complaints/components \
  features/dashboard/pages features/dashboard/components \
  features/admin/pages features/admin/components

touch routes/AppRoutes.jsx \
  layouts/MainLayout.jsx layouts/AuthLayout.jsx layouts/DashboardLayout.jsx \
  services/apiClient.js store/store.js context/AuthContext.jsx hooks/useAuth.js \
  utils/formatters.js \
  features/auth/authApi.js features/auth/pages/LoginPage.jsx features/auth/pages/RegisterPage.jsx \
  features/advertisers/advertisersApi.js \
  features/spaces/spacesApi.js \
  features/availability/availabilityApi.js \
  features/rateCards/rateCardsApi.js \
  features/campaigns/campaignsApi.js \
  features/bookings/bookingsApi.js \
  features/quotations/quotationsApi.js \
  features/creatives/creativesApi.js \
  features/contracts/contractsApi.js \
  features/payments/paymentsApi.js \
  features/execution/executionApi.js \
  features/performance/performanceApi.js \
  features/notifications/notificationsApi.js \
  features/complaints/complaintsApi.js \
  features/dashboard/dashboardApi.js \
  features/admin/adminApi.js
```

All files are created **empty** — you fill them in as each teammate builds
their slice.

---

## 5. Note on state management

You don't have to use Redux — the `context/AuthContext.jsx` alone is enough
if the team prefers to keep things simple and just use local component state
+ axios calls per feature. Redux Toolkit is included above because with 3
people working on 19 features in parallel, a shared predictable store avoids
prop-drilling conflicts. If the team finds it overkill, delete `store/` and
skip the `@reduxjs/toolkit` install.

---

## 6. Backend Architecture (Flask blueprints)

```
backend/
├── app/
│   ├── __init__.py            # app factory, blueprint registration
│   ├── extensions.py          # db, login_manager, migrate instances
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── schemas.py
│   ├── advertisers/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── spaces/                 # categories, spaces, locations, availability, rate_cards
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── campaigns/               # campaigns, campaign_spaces, bookings
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── quotations/               # quotations, quotation_items, contracts
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── creatives/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── payments/                  # payments, invoices
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── execution/                  # campaign_events, performance_metrics
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── notifications/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── complaints/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── admin/                       # user/role mgmt, audit logs
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── api/                          # shared REST helpers/versioning
│   │   └── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── advertiser.py
│   │   ├── space.py
│   │   ├── campaign.py
│   │   ├── booking.py
│   │   ├── quotation.py
│   │   ├── creative.py
│   │   ├── contract.py
│   │   ├── payment.py
│   │   ├── execution.py
│   │   ├── notification.py
│   │   ├── complaint.py
│   │   └── audit.py
│   ├── templates/
│   └── static/
├── migrations/
├── tests/
├── uploads/
├── config.py
├── requirements.txt
├── run.py
└── README.md
```

### Scaffold command (run inside `backend/`)

```bash
mkdir -p app/auth app/advertisers app/spaces app/campaigns app/quotations \
  app/creatives app/payments app/execution app/notifications app/complaints \
  app/admin app/api app/models app/templates app/static \
  migrations tests uploads

touch app/__init__.py app/extensions.py \
  app/auth/__init__.py app/auth/routes.py app/auth/schemas.py \
  app/advertisers/__init__.py app/advertisers/routes.py \
  app/spaces/__init__.py app/spaces/routes.py \
  app/campaigns/__init__.py app/campaigns/routes.py \
  app/quotations/__init__.py app/quotations/routes.py \
  app/creatives/__init__.py app/creatives/routes.py \
  app/payments/__init__.py app/payments/routes.py \
  app/execution/__init__.py app/execution/routes.py \
  app/notifications/__init__.py app/notifications/routes.py \
  app/complaints/__init__.py app/complaints/routes.py \
  app/admin/__init__.py app/admin/routes.py \
  app/api/__init__.py \
  app/models/__init__.py app/models/user.py app/models/advertiser.py app/models/space.py \
  app/models/campaign.py app/models/booking.py app/models/quotation.py app/models/creative.py \
  app/models/contract.py app/models/payment.py app/models/execution.py app/models/notification.py \
  app/models/complaint.py app/models/audit.py \
  config.py requirements.txt run.py README.md
```

### Python environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install flask flask-sqlalchemy flask-migrate flask-login flask-wtf flask-cors psycopg2-binary python-dotenv marshmallow
pip freeze > requirements.txt
```

---

## 7. Environment files

`backend/.env`
```
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=change-me
DATABASE_URL=postgresql://user:password@localhost:5432/adbooking
```

`frontend/.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 8. Team Role Distribution — Backend-First Approach

The backend is built entirely by one person before the team splits up
frontend work. Here's how that's structured so the other two aren't idle
while it's being built.

### Backend Owner — builds everything in `backend/`

Owns **all** blueprints and models across all 22 tables, working through
the backend portion of Phases 1–6 (§10) in order: auth/JWT, every CRUD +
business-rule endpoint, migrations, and — critically — a working
**Postman/Thunder Client collection** documenting every route (method, URL,
expected payload, expected response, and which role can call it) by the
time the backend is "done." That collection is the handoff document the
frontend team integrates against, so keep it up to date as you go rather
than writing it at the end.

### Frontend Team — the other two members

Rather than waiting on the backend to finish before touching anything,
they work in **two stages**:

**Stage 1 (runs in parallel with the backend build):** Build every screen
in the feature-folder architecture (§4) against **mock/dummy JSON**
hardcoded directly in each `xApi.js` file, so the full UI is clickable —
navigation, forms, tables, role-based layouts — before a single real
endpoint exists. This is a standard real-world pattern (build against a
mocked API contract), and it means nobody is blocked waiting on the
backend.

**Stage 2 (once the backend + Postman collection is ready):** Swap the
mock data in each `xApi.js` for real `axios` calls to the live backend,
feature folder by feature folder. Split the 19 frontend feature folders
between the two people:

| Person | Feature folders |
|---|---|
| Frontend Dev 1 | auth, advertisers, spaces, availability, rateCards, campaigns, bookings, quotations |
| Frontend Dev 2 | creatives, contracts, payments, execution, performance, notifications, complaints, dashboard, admin |

Once the Backend Owner finishes and self-tests the backend, they join the
other two for wiring/QA and dashboard integration — so by the final phase,
all three are working together again.

---

## 9. Suggested Git Workflow

```
main
 ├── dev
 │    ├── feature/backend-all        (Backend Owner — Phases 1–6 backend)
 │    ├── feature/frontend-mocks     (Frontend Team — Stage 1, mock data)
 │    └── feature/frontend-live      (Frontend Team — Stage 2, real API wiring)
```

The Frontend Team can branch `feature/frontend-mocks` off `dev` on day 1 and
merge it early — then branch `feature/frontend-live` once Stage 2 wiring
starts (Phase 4–5), replacing mock calls feature by feature as the backend
ships. The Backend Owner merges backend work incrementally per phase rather
than as one giant PR at the end, so the Postman collection (and the
Frontend Team's Stage 2 wiring) always has something current to work
against.

---

## 10. Step-by-Step Build Approach (follow in this order)

This is the actual sequence to follow, phase by phase, under the
**backend-first** structure from §8: the Backend Owner works straight
through the backend side of Phases 1–6 alone; the Frontend Team builds
every screen against mock data in parallel (Stage 1), then swaps to real
API calls per feature once that feature's backend ships (Stage 2). Each
phase lists what gets built and what "done" looks like before moving on.

### Phase 0 — Setup (everyone, together, day 1)
1. Backend Owner runs the backend scaffold (§6), confirms `flask run` boots
   with a placeholder route, commits.
2. Frontend Team runs the Vite scaffold (§3) and the feature-folder
   scaffold (§4), confirms `npm run dev` works, commits.
3. Set up `.env` files (§7), create the Postgres database, run an empty
   `flask db init` / `flask db migrate` to confirm the DB connection works.
4. Agree as a team on the JSON response shape and JWT header format up
   front — this is the contract the Frontend Team's mock data will mirror,
   so nail it down before Stage 1 mock-building starts.
5. **Done when:** frontend dev server runs, backend dev server runs, DB
   connects, and everyone has the same starting scaffold.

### Phase 1 — Users & Advertising Inventory *(Backend Owner: backend · Frontend Team: Stage 1 mocks)*
1. **Backend:** Build `users`, `roles` models + migrations. Build the
   `auth` blueprint: register, login, logout, JWT issue/refresh, role-based
   decorators (`@role_required('admin')` etc.). Build `advertisers`,
   `advertiser_contacts`, `space_categories`, `locations`,
   `advertising_spaces` models + CRUD routes.
2. **Frontend (mock data):** Build LoginPage, RegisterPage, AuthContext,
   protected-route wrapper, advertiser profile page, and the space catalog
   list/search page — all against hardcoded JSON in each `xApi.js`, so the
   screens are fully clickable without a live backend yet.
3. **Done when:** backend — you can register/login as different roles via
   Postman and a space manager/admin can add a space via the API. frontend
   — the same screens render and navigate correctly using mock data.

### Phase 2 — Availability & Rates *(Backend Owner: backend · Frontend Team: Stage 1 mocks)*
1. **Backend:** Build `space_availability` model + endpoint to check/
   reserve a date range, enforcing the "no overlapping confirmed bookings"
   rule at the service layer. Build `rate_cards` model + CRUD + pricing
   lookup by space/date.
2. **Frontend (mock data):** Build the calendar/date-range picker
   (`features/availability`) and the rate table (`features/rateCards`),
   plus search/filter on the catalog page — still against mock data.
3. **Done when:** backend — availability and pricing endpoints return
   correct data via Postman. frontend — the same UI is clickable with
   realistic mock availability/pricing.

### Phase 3 — Campaigns & Booking *(Backend Owner: backend · Frontend Team: Stage 1 mocks)*
1. **Backend:** Build `campaigns`, `campaign_spaces`, `bookings` models +
   routes. Build campaign creation (draft status), then `quotations`,
   `quotation_items` models + routes (generate a quotation from a draft
   campaign — space charges + tax − discount). Wire booking confirmation:
   only moves to `confirmed` once the quotation is approved.
2. **Frontend (mock data):** Build campaign create/edit + space selection
   (`features/campaigns`) and quotation view/approve
   (`features/quotations`) against mock data.
3. **Done when:** backend — a campaign can be created, spaces attached
   without double-booking, and a quotation generated/approved, all via
   Postman. frontend — the same flow is clickable with mock data.

### Phase 4 — Creative Approval, Contracts & Payment *(Backend Owner: backend · Frontend Team: Stage 1 mocks, and begins Stage 2 wiring on Phase 1–2 features once those are stable)*
1. **Backend:** Build `creative_assets`, `creative_reviews` models + file
   upload route (`uploads/`) + review/approve/reject route. Build
   `contracts` model + route (auto-generated once quotation accepted).
   Build `payments`, `invoices` models + routes. Enforce the two remaining
   business rules: creative must be approved before go-live; campaign only
   becomes `active` once required payment status is met.
2. **Frontend:** Continue Stage 1 mocks for `features/creatives`,
   `features/contracts`, `features/payments`. If Phase 1–2 backend
   endpoints are already stable and documented in the Postman collection,
   the Frontend Team can start Stage 2 (real wiring) on `auth`,
   `advertisers`, and `spaces` now instead of waiting for everything.
3. **Done when:** backend — a campaign can go quotation → creative approved
   → contract → payment recorded → `active`, end to end, via Postman.
   frontend — matching screens are clickable (mock or live, per above).

### Phase 5 — Execution, Reports & Support *(Backend Owner finishes backend · Frontend Team: Stage 2 — full wiring begins)*
1. **Backend:** Build `campaign_events`, `performance_metrics` models +
   routes. Build `notifications` model + routes, triggered from events in
   earlier phases. Build `complaints` model + routes. Build `audit_logs`,
   hooked into key write actions across all blueprints. Build the
   `dashboard` blueprint (read-only aggregation across all tables).
   **This is where the backend is considered complete** — finalize the
   Postman collection as the handoff document.
2. **Frontend — Stage 2 begins in full:** Split the 19 feature folders
   between the two Frontend Dev roles per the table in §8, and swap every
   `xApi.js` from mock data to real `axios` calls against the now-complete
   backend. Build `features/execution`, `features/performance`,
   `features/notifications`, `features/complaints`, and the role-based
   `features/dashboard` (KPIs, search/filter/pagination, exportable
   PDF/CSV reports).
3. **Backend Owner joins the Frontend Team** for wiring/QA and dashboard
   integration once backend self-testing is done — all three work together
   from here on.
4. **Done when:** every screen is running against the real backend (no
   more mock data anywhere), every role has a working dashboard,
   notifications fire on key events, and reports export correctly.

### Phase 6 — Professional Deployment *(everyone)*
1. Formalize the `api` blueprint (versioning, consistent error handling).
2. Write Pytest tests for business rules (double-booking prevention,
   approval gating, payment gating) and role permissions.
3. Write frontend tests (Vitest) for the critical flows.
4. Write Dockerfiles for backend and frontend + `docker-compose.yml` wiring
   in Postgres.
5. Finalize `README.md` (setup instructions, `.env.example`, how to run
   migrations, how to run tests).
6. Do a full run-through against the Final Demonstration Checklist (§31 of
   the original requirement doc) before presenting.
7. **Done when:** the whole system runs via `docker-compose up`, tests
   pass, and the demo checklist is fully satisfied.

---

## 13. Git & Project Config Files

These go in alongside the folders you already scaffolded — create them
once, right after Phase 0, before anyone starts committing real code.

### `frontend/.gitignore`

The Vite scaffold (§3) already generates one for you, but confirm it looks
like this — if not, replace it:

```
node_modules
dist
dist-ssr
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea

# Env
.env
.env.local
.env.*.local
!.env.example

# OS
.DS_Store
```

### `backend/.gitignore`

Flask doesn't scaffold one for you — create this manually:

```
# Python
venv/
env/
__pycache__/
*.py[cod]
*.egg-info/
.pytest_cache/
.coverage
htmlcov/

# Flask
instance/
*.sqlite3

# Env
.env
.env.*
!.env.example

# Uploads (keep the folder, ignore its contents)
uploads/*
!uploads/.gitkeep

# OS / editor
.DS_Store
.vscode/
.idea/
```

> Note: don't gitignore `migrations/versions/` — those files are how
> teammates and your deployment get the same database schema. Only
> `__pycache__` inside migrations should be ignored (already covered above).

Create the placeholder so the empty `uploads/` folder still gets tracked:

```bash
touch backend/uploads/.gitkeep
```

### `.env.example` (one in each of `frontend/` and `backend/`)

Real `.env` files are gitignored, so commit an `.env.example` with the same
keys and dummy values — this is how teammates know what to fill in without
you ever committing real secrets.

`backend/.env.example`
```
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=replace-with-a-random-string
DATABASE_URL=postgresql://user:password@localhost:5432/adbooking
```

`frontend/.env.example`
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### `.gitattributes` (repo root)

Prevents line-ending mismatches if teammates are on different OSes
(common cause of noisy diffs in a 3-person team):

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.jpeg binary
*.ico binary
```

### Linting & formatting

- **ESLint** — already set up by the Vite scaffold since you selected it
  during `npm create vite`. It comes with `eslint-plugin-react-hooks` and
  `eslint-plugin-react-refresh` out of the box; don't remove those, they
  catch real bugs (stale closures in hooks, bad Fast Refresh boundaries).
- **Prettier** (recommended addition, keeps formatting identical across 3
  people's editors):
  ```bash
  cd frontend
  npm install -D prettier eslint-config-prettier
  ```
  `frontend/.prettierrc`
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 100
  }
  ```
  Then add `"prettier"` to the `extends` array in your ESLint config so the
  two don't fight over formatting rules.
- **Backend formatting** (optional but keeps 3 people's Python consistent):
  ```bash
  pip install black flake8
  ```

### Root-level files

```
adbooking-system/
├── .gitattributes
├── .gitignore          # only needed if NOT using separate .gitignore per folder
├── README.md            # top-level: what the project is, how to run both halves
├── frontend/
└── backend/
```

If you're keeping `frontend/` and `backend/` in **one** git repo (recommended
for a student project — one repo, one commit history, easier for
supervisors to review), you don't strictly need a root `.gitignore` since
each folder has its own, but you can add one at the root anyway to catch
stray OS files (`.DS_Store`, `Thumbs.db`) outside both folders.

---

## 11. Authentication Strategy — Build Early, Test Painlessly

Role-based permission checks are core business logic in this system (see
§26 of the requirement doc), not just a login gate — so auth is built in
**Phase 1**, not deferred to the end. Retrofitting role checks across 22
tables' worth of already-built endpoints is more work than building them in
from the start.

The actual pain point — not wanting to manually log in through a form for
every test — is solved differently, without skipping auth:

1. **Use JWT, not session cookies.** Login once, get a token back, and
   every subsequent request just carries that token in a header. You are
   not re-logging in "every time" — you log in once per work session.
2. **Use Postman or Thunder Client (VS Code extension) for API testing,
   not the browser.** Save the token as an environment variable once
   (`{{token}}`), and every request in the collection reuses it
   automatically. Swapping roles to test permissions = swap which saved
   token you're using, not re-typing a login form.
3. **Seed the database with one test user per role** (`advertiser@test.com`,
   `sales@test.com`, `spacemanager@test.com`, `reviewer@test.com`,
   `finance@test.com`, `admin@test.com`, same password) via a `seed.py`
   script, so grabbing a token for any role is one request away.
4. **In local development only**, you can add a `DEV_MODE` flag in `.env`
   that lets a decorator bypass the role check and log the bypass — never
   ship this flag as `true`, but it's a legitimate way to iterate fast on a
   single endpoint before wiring the real token in.

This gets you the testing speed you wanted, while keeping role-based
authorization real and working from Phase 1 onward — which also means it's
already correct and demo-ready by the time you reach Phase 6, instead of
being a rushed afterthought right before your presentation.

---

## 12. Making This Exhibition/Demo Ready

Since this will be shown at an IT exhibition, "working" isn't the bar —
*looking like a real product with real edge cases handled* is. Build these
in as you go, not as an afterthought:

**Realistic seed data** — don't demo with `Test Campaign 1`. Seed 3–4
advertisers with real-sounding company names, a dozen spaces across
different cities/categories, a few campaigns in different stages (one still
in quotation, one active, one completed) so the dashboard looks alive the
moment you open it.

**Edge cases to explicitly handle and be ready to demo, not just avoid:**
- Attempting to double-book a space for overlapping dates → show the
  rejection, not just prevent it silently.
- A creative gets **rejected** by the reviewer, advertiser re-uploads a
  corrected version → show the version history (`creative_assets.version`).
- A campaign's payment is **partial** → booking stays pending until balance
  clears, shown clearly on the advertiser's dashboard.
- A campaign **expires** without being renewed → status auto-flips, doesn't
  linger as "active" (this is explicitly called out in §6 of the spec).
- A **complaint** is filed mid-campaign and resolved → shows the support
  workflow, not just the happy path.
- An **unauthorized** role attempts a restricted action (e.g., an
  Advertiser calling the payment-confirmation endpoint) → show the 403,
  proves your role security actually works instead of just existing.

**Demo script structure** (mirrors §31 of the requirement doc): log in as
each of 2–3 roles in sequence, walk one campaign end-to-end from creation
through completion touching every phase you built, then show the admin
dashboard/reports and one deliberate failure case (double-booking attempt
or unauthorized action) to prove the guardrails work. That failure case is
often what makes a student demo stand out — it shows you engineered for
real conditions, not just the happy path.
