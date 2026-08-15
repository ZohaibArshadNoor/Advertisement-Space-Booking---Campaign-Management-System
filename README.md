# Advertisement Space Booking & Campaign Management System

A comprehensive booking-and-operations platform for **advertising space** (billboards, digital screens, transit ads, banners, and digital slots). The system connects **Advertisers** seeking ad inventory with **Agency Staff** (Sales, Space Managers, Creative Reviewers, Finance Officers, and Admins).

---

## 🏛️ System Architecture

### Core Workflow
```text
Advertiser registers → Searches spaces → Checks availability → Creates campaign 
→ Receives quotation → Booking approved → Creative uploaded & approved 
→ Payment completed → Campaign executes → Analytics & reporting
```

### Key Business Guardrails
1. **Zero Double-Booking**: Spaces cannot have overlapping confirmed bookings.
2. **Creative Gate**: Creative artwork must be reviewed and approved before campaign execution.
3. **Payment Gate**: Campaign cannot activate until mandatory payment thresholds are met.
4. **Role-Based Access**: Multi-tenant permissions across 6 distinct user roles.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Backend API** | Python / Flask | RESTful API with Modular Blueprints |
| **Database** | PostgreSQL | 22 Relational Tables with SQLAlchemy ORM |
| **Database Migrations** | Flask-Migrate (Alembic) | Versioned schema tracking |
| **Authentication** | Flask-Login + PyJWT | Role-based token authentication |
| **Frontend Client** | React 18 / Vite (JavaScript) | Feature-based modular SPA |
| **UI & Styling** | Bootstrap 5 / React-Bootstrap | Responsive operational dashboards |
| **State & Routing** | Context API / Redux Toolkit, React Router v7 | State & route management |
| **Data & Charts** | Axios, Chart.js / React-ChartJS-2 | Interactive KPI analytics |

---

## 📁 Repository Layout

```text
adbooking-system/
├── backend/                  # Flask REST API
│   ├── app/                  # Application factory, blueprints, models, extensions
│   ├── migrations/           # Database migration versions
│   ├── tests/                # Automated backend test suite
│   ├── uploads/              # Creative assets upload store (.gitkeep)
│   ├── config.py             # App environment configurations
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Backend server entry point
│   ├── .env.example          # Backend environment template
│   └── README.md             # Backend setup guide
│
├── frontend/                 # Vite + React client
│   ├── src/
│   │   ├── features/         # 19 Feature-isolated modules (pages, components, API clients)
│   │   ├── layouts/          # MainLayout, AuthLayout, DashboardLayout
│   │   ├── routes/           # Protected & public routing
│   │   ├── services/         # Axios API client & interceptors
│   │   ├── context/          # Auth context & state providers
│   │   └── components/       # Shared UI & common widgets
│   ├── package.json          # Node dependencies & scripts
│   ├── vite.config.js        # Vite build & dev config
│   ├── .env.example          # Frontend environment template
│   └── README.md             # Frontend setup guide
│
├── architecture.md           # Detailed engineering architecture & schema reference
├── .gitattributes            # Line endings & binary format definitions
├── .gitignore                # Root git ignore definitions
└── README.md                 # Project root documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 14+

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv myenv
# Windows:
myenv\Scripts\activate
# Linux/macOS:
source myenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run database migrations
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Start Flask server
python run.py
```
> Backend runs at `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)

---

### 2. Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Configure environment
cp .env.example .env

# Run development server
npm run dev
```
> Frontend runs at `http://localhost:5173`

---

## 👥 Team Workstreams & Phases

- **Phase 0 (Setup):** Scaffolding, environment configurations, and base servers.
- **Phase 1 (Identity & Inventory):** Auth / JWT, Advertisers, Spaces, Categories, Locations.
- **Phase 2 (Availability & Rates):** Calendar availability engine, Rate cards, Pricing matrix.
- **Phase 3 (Campaigns & Bookings):** Campaign drafting, Quotation generation, Booking approval.
- **Phase 4 (Creatives, Contracts & Payments):** Creative uploads/review, Contract generation, Invoicing/Payments.
- **Phase 5 (Execution, Support & Reports):** Event tracking, Complaints, Notifications, Audit logs, Analytics dashboards.
- **Phase 6 (Deployment & QA):** Automated test suite, Docker deployment, Demo verification.

For full architectural details, consult [architecture.md](architecture.md).
