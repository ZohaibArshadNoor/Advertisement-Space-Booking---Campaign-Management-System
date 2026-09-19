# 📢 Advertisement Space Booking & Campaign Management System

An enterprise-grade, omnichannel booking and campaign operations platform for **Out-of-Home (OOH) Advertising** (Digital Billboards, Highway Unipoles, Mall Screens, Transit Displays), **Digital Ad Networks** (Meta, Google Ads, YouTube), and **Verified Influencer / Creator Sponsorships**.

Built with a modular **Python Flask REST API**, **PostgreSQL / SQLAlchemy ORM**, and a responsive **React 18 + Vite** frontend application.

---

## 📑 Table of Contents
- [🏛️ System Architecture](#️-system-architecture)
- [✨ Key Platform Features](#-key-platform-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [📁 Repository Structure](#-repository-structure)
- [⚙️ Step-by-Step Setup & Installation Guide](#️-step-by-step-setup--installation-guide)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup & Virtual Environment](#2-backend-setup--virtual-environment)
  - [3. Environment Variables Configuration (.env)](#3-environment-variables-configuration-env)
  - [4. Database Initialization & Seeding](#4-database-initialization--seeding)
  - [5. Frontend Setup & Launch](#5-frontend-setup--launch)
- [🔐 Pre-Seeded Demo Accounts & Credentials](#-pre-seeded-demo-accounts--credentials)
- [📡 API Endpoints Overview](#-api-endpoints-overview)
- [🚀 Git Commands: How to Push to the Main Branch](#-git-commands-how-to-push-to-the-main-branch)
- [📄 License & Author](#-license--author)

---

## 🏛️ System Architecture

### Core Workflow & Business Gates
```mermaid
flowchart TD
    A["Advertiser Discovers Inventory & Creators"] --> B["Select Dates & Request Quotation"]
    B --> C["Automated Rate Calculation & Quotation"]
    C --> D{"Agency / Space Manager Approval"}
    D -- Approved --> E["Creative Asset Upload"]
    D -- Rejected / Cancelled --> A
    E --> F{"Creative Reviewer Gate"}
    F -- Approved --> G["Contract & Invoice Generation"]
    F -- Revisions Requested --> E
    G --> H{"Finance / Payment Gate (Deposit / Full)"}
    H -- Paid --> I["Campaign Execution & Active Display"]
    I --> J["Real-Time Performance Analytics & ROI Dashboard"]
```

### Business Guardrails
1. **Zero Double-Booking Engine**: Prevents overlapping date reservations across all physical and digital slots.
2. **Creative Moderation Gate**: High-resolution artwork and videos must be verified by a Creative Reviewer before ad deployment.
3. **Payment Gate**: Campaign activation is strictly locked until invoice deposit thresholds are satisfied.
4. **Role-Based Access Control (RBAC)**: Fine-grained permissions for 7 distinct enterprise roles.

---

## ✨ Key Platform Features

- 🏢 **OOH Billboard & Space Discovery**: Explore high-impact billboards, LED video walls, and transit shelters with dynamic filtering by city, type, and traffic impressions.
- 🌟 **Creator & Influencer Marketplace**: Discover verified creators across YouTube, Instagram, and TikTok with reach metrics and agency-managed brand collaboration requests.
- 📱 **Digital Marketing Packages**: Book bundled social media ad campaigns (Meta Ads, Google Search/Display, YouTube Video Ads) with estimated CPM/CPC projections.
- 💰 **Automated Quotations & Invoicing**: Real-time rate cards, tax/discount calculation, invoice generation, and mock payment gateway processing.
- 🎨 **Creative Asset Workflow**: Multi-format media uploader supporting image and video proofing with revision status tracking.
- 📊 **Executive Analytics & Reporting**: Real-time revenue charts, occupancy rates, conversion statistics, and audit logs for compliance.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Python 3.10+, Flask 3.0, Flask-Login, PyJWT, Marshmallow |
| **Database & ORM** | PostgreSQL (or Supabase), SQLAlchemy ORM, Flask-Migrate (Alembic) |
| **Frontend Framework** | React 18, Vite, React Router v7 |
| **UI Components & Styling** | Bootstrap 5, React-Bootstrap, Lucide React, Custom CSS Design System |
| **Data Visualization** | Chart.js, React-ChartJS-2 |
| **Network & State** | Axios (with JWT interceptors), React Context API |

---

## 📁 Repository Structure

```text
adbooking-system/
├── .gitignore                # Global git ignore rules (keeps secrets & builds out of git)
├── README.md                 # Project master documentation
├── architecture.md           # Deep-dive database schema & technical blueprint
│
├── backend/                  # Flask REST API
│   ├── app/
│   │   ├── admin/            # Platform administration & analytics
│   │   ├── advertisers/      # Advertiser profile & corporate management
│   │   ├── auth/             # JWT authentication & role-based access
│   │   ├── availability/     # Inventory scheduling & calendar conflict engine
│   │   ├── bookings/         # Booking contracts & life-cycle state machine
│   │   ├── campaigns/        # Campaign management & target metrics
│   │   ├── creatives/        # Creative asset upload & reviewer pipeline
│   │   ├── digital_services/ # Digital ads (Meta, Google, YouTube) configuration
│   │   ├── influencers/      # Creator discovery & brand sponsorship deals
│   │   ├── models/           # 22 SQLAlchemy database models
│   │   ├── payments/         # Invoices, transactions & payment gateways
│   │   ├── seed/             # Comprehensive database seed data
│   │   └── spaces/           # Billboard & space inventory management
│   ├── uploads/              # Storage directory for uploaded creatives
│   ├── .env.example          # Backend environment variable template
│   ├── config.py             # Flask configuration classes
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Local development server entrypoint
│   └── seed.py               # Database table generator & demo seeder
│
└── frontend/                 # React + Vite Single Page Application
    ├── public/               # Static assets & icons
    ├── src/
    │   ├── components/       # Reusable UI widgets (Navbar, Footer, Modals)
    │   ├── context/          # Auth context & global state
    │   ├── features/         # 19 Feature modules (Spaces, Influencers, Bookings, etc.)
    │   ├── layouts/          # Responsive shell layouts
    │   ├── routes/           # Role-based protected routes
    │   ├── services/         # Axios API service instances
    │   └── styles/           # Global styles and design system variables
    ├── .env.example          # Frontend environment variable template
    ├── package.json          # Node dependencies & npm scripts
    └── vite.config.js        # Vite build configuration
```

---

## ⚙️ Step-by-Step Setup & Installation Guide

Follow these instructions to clone, configure, seed, and run the entire platform locally from scratch.

### Prerequisites
Make sure you have the following installed on your machine:
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Python 3.10+**: [Download Python](https://www.python.org/downloads/) *(ensure "Add Python to PATH" is checked)*
- **Node.js 18+ & npm**: [Download Node.js](https://nodejs.org/)
- **PostgreSQL Database**: Either a local PostgreSQL instance, or a free cloud database like [Supabase](https://supabase.com/) / [Neon](https://neon.tech/).

---

### 1. Clone the Repository

Open your terminal (PowerShell, Command Prompt, or Bash) and clone the repository:

```bash
git clone https://github.com/ZohaibArshadNoor/Advertisement-Space-Booking---Campaign-Management-System.git adbooking-system
cd adbooking-system
```

---

### 2. Backend Setup & Virtual Environment

Navigate to the `backend` directory:

```bash
cd backend
```

#### Create a Python Virtual Environment:
- **Windows (PowerShell or CMD):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```
- **macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

#### Install Backend Dependencies:
```bash
pip install -r requirements.txt
```

---

### 3. Environment Variables Configuration (.env)

> [!IMPORTANT]
> Actual `.env` files contain sensitive secrets and are **strictly excluded** by `.gitignore`. You must create `.env` files from the provided `.env.example` templates.

#### A. Backend `.env` File
In the `backend/` directory, create a `.env` file by copying `.env.example`:

- **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
- **macOS / Linux:**
  ```bash
  cp .env.example .env
  ```

Open `backend/.env` in your text editor and update your database credentials:
```env
# Flask Environment
FLASK_ENV=development
FLASK_APP=run.py

# Cryptographic Keys (change or keep default for development)
SECRET_KEY=super-secret-system-key-change-in-production
JWT_SECRET_KEY=super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES_HOURS=8

# Database Connection URL (PostgreSQL)
# Format: postgresql://<user>:<password>@<host>:<port>/<database_name>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/adbooking_db

# File Storage
UPLOAD_FOLDER=uploads/creatives
MAX_CONTENT_LENGTH=52428800

# Trusted Frontend Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173
```

#### B. Frontend `.env` File
In a new terminal, navigate to the `frontend/` directory and copy its template:

- **Windows (PowerShell):**
  ```powershell
  cd frontend
  Copy-Item .env.example .env
  ```
- **macOS / Linux:**
  ```bash
  cd frontend
  cp .env.example .env
  ```

Your `frontend/.env` will contain:
```env
# Points frontend API calls to the Flask backend server
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### 4. Database Initialization & Seeding

Make sure your PostgreSQL server is running and the database specified in `DATABASE_URL` exists.

From the `backend/` directory (with virtualenv activated):

```bash
python seed.py
```

This single command automatically:
1. Creates all **22 database tables**.
2. Seeds predefined system roles and permissions.
3. Seeds realistic OOH inventory, billboard spaces, rate cards, and digital marketing services.
4. Seeds 6 verified influencer profiles and sample sponsorship contracts.
5. Populates complete demo accounts across all user roles.

#### Start the Flask Backend Server:
```bash
python run.py
```
> 🚀 Backend will be running live at: **`http://127.0.0.1:5000`**  
> 🩺 Health check endpoint: **`http://127.0.0.1:5000/api/health`**

---

### 5. Frontend Setup & Launch

Open a separate terminal window and navigate to the `frontend/` directory:

```bash
cd frontend
```

#### Install Node Packages:
```bash
npm install
```

#### Start the Vite Development Server:
```bash
npm run dev
```

> 🌐 Frontend application will launch at: **`http://localhost:5173`**

---

## 🔐 Pre-Seeded Demo Accounts & Credentials

The database seeder automatically provides test accounts for every system role. All demo accounts use the standard password: `password123`.

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **System Administrator** | `admin@test.com` | `password123` | Full portal access, user management, audit logs, revenue analytics |
| **Advertiser** | `advertiser@test.com` | `password123` | Explore spaces, book creators, build campaigns, upload creatives, pay invoices |
| **Space Manager** | `spaces@test.com` | `password123` | Add/edit billboard inventory, adjust rate cards, manage calendar availability |
| **Finance Officer** | `finance@test.com` | `password123` | Approve payments, verify invoice settlements, view financial audit logs |
| **Sales Executive** | `sales@test.com` | `password123` | Manage advertiser leads, generate custom quotations, review campaign terms |
| **Creative Reviewer** | `reviewer@test.com` | `password123` | Review uploaded artwork/videos, approve creatives, request revisions |
| **Influencer / Creator** | `influencer@test.com` | `password123` | View creator profile, monitor collaboration requests and brand deals |

---

## 📡 API Endpoints Overview

| Module | Method & Endpoint | Description |
|---|---|---|
| **Auth** | `POST /api/auth/login` | Authenticate user & issue JWT token |
| | `POST /api/auth/register` | Register new advertiser account |
| | `GET /api/auth/me` | Fetch authenticated user profile & permissions |
| **Spaces** | `GET /api/spaces` | Query billboard & display inventory with filters |
| | `POST /api/spaces` | Create new advertising space (*Space Manager / Admin*) |
| | `GET /api/spaces/:id/availability` | Check calendar availability & conflicts |
| **Campaigns** | `GET /api/campaigns` | List user campaigns |
| | `POST /api/campaigns` | Create new campaign draft |
| **Bookings** | `POST /api/bookings` | Submit space booking reservation |
| | `PATCH /api/bookings/:id/status` | Update booking status (*Approved / Cancelled*) |
| **Influencers** | `GET /api/influencers` | Discover agency creator roster |
| | `POST /api/influencers/hire` | Submit creator sponsorship request |
| | `GET /api/influencers/hired` | List active creator brand deals |
| **Digital Services** | `GET /api/digital-services` | Get Meta / Google / YouTube service packages & base rates |
| | `POST /api/digital-services/book` | Book digital advertising package |
| **Creatives** | `POST /api/creatives/upload` | Upload high-resolution creative media file |
| | `POST /api/creatives/:id/review` | Approve or reject creative submission |
| **Payments** | `GET /api/payments/invoices` | List campaign invoices |
| | `POST /api/payments/pay` | Process invoice payment transaction |
| **Analytics** | `GET /api/admin/dashboard` | Aggregated executive KPIs, occupancy & revenue metrics |

---

## 🚀 Git Commands: How to Push to the Main Branch

To push all your latest changes, documentation, and clean commits to the remote `main` branch:

### Option A: Merge Current Branch into `main` (Recommended)
If you have been working on a feature branch (e.g. `digital-marketing`):

```bash
# 1. Check current status
git status

# 2. Stage all updated files (.gitignore, README.md, code updates)
git add .

# 3. Commit your changes
git commit -m "docs: comprehensive README setup guide and repository configurations"

# 4. Switch to main branch
git checkout main

# 5. Pull any latest remote changes
git pull origin main

# 6. Merge feature branch into main
git merge digital-marketing

# 7. Push everything to GitHub main
git push origin main
```

### Option B: Direct Push from Current Branch to `main`
If you want to push your current working branch directly to the remote `main`:

```bash
# 1. Stage all changes
git add .

# 2. Commit changes
git commit -m "feat: complete omnichannel ad booking system with docs and seeding"

# 3. Push current branch directly to origin main
git push origin HEAD:main
```

---

## 📄 License & Author

- **Author**: Zohaib Arshad Noor
- **Repository**: [Advertisement Space Booking & Campaign Management System](https://github.com/ZohaibArshadNoor/Advertisement-Space-Booking---Campaign-Management-System)
- **License**: MIT License
