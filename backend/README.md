# Backend — Advertisement Space Booking API

Flask REST API providing role-based advertising inventory management, campaign bookings, quotation/contract workflows, creative reviews, payments, execution tracking, and reporting.

## Tech Stack
- **Framework:** Flask
- **Database:** PostgreSQL
- **ORM & Migrations:** Flask-SQLAlchemy, Flask-Migrate (Alembic)
- **Authentication:** Flask-Login + PyJWT
- **Validation:** Flask-WTF / Marshmallow

## Getting Started

### 1. Setup Virtual Environment
```bash
python -m venv myenv
# On Windows:
myenv\Scripts\activate
# On Linux/macOS:
source myenv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure your database connection and secret key:
```bash
cp .env.example .env
```

### 4. Database Migrations
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### 5. Run the Server
```bash
python run.py
# or
flask run --port 5000
```
API Health Check is available at `http://localhost:5000/api/health`.
