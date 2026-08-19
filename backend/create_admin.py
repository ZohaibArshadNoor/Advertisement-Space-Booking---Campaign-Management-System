from app.extensions import db
from app.models.role import Role
from app.models.user import User


def create_admin():
    admin_role = Role.query.filter_by(name="Administrator").first()

    if not admin_role:
        print("Error: Administrator role not found. Run 'flask seed' first.")
        return

    admin_email = "admin@example.com"
    existing_admin = User.query.filter_by(email=admin_email).first()

    if existing_admin:
        print(f"User with email {admin_email} already exists.")
        return

    admin = User(
        name="System Admin",
        email=admin_email,
        role=admin_role,
        is_active=True
    )

    admin.set_password("TestPassword123")

    db.session.add(admin)
    db.session.commit()

    print("Admin user seeded successfully!")