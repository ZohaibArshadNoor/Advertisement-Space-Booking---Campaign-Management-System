"""
Database initialization and demo data seeding script.
Run this script once on your cloud server or locally:
    python seed.py
"""
from app import create_app
from app.extensions import db
from app.seed.seed_demo import seed_demo_data

app = create_app()

with app.app_context():
    print("[INIT] Creating database schema tables...")
    db.create_all()
    print("[INIT] Database schema created successfully.")
    
    print("[INIT] Seeding initial roles, users, inventory, and transactions...")
    seed_demo_data()
    print("[INIT] Database seeding completed successfully!")
