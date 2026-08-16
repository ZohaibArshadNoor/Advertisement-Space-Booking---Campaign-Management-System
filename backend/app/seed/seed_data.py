from app.extensions import db
from app.models.role import Role


# These are the six roles defined by the project requirements.
#
# We keep them in one place so that the seed operation is
# predictable and repeatable.
ROLES = [
    {
        "name": "Advertiser",
        "permissions": {
            "campaign.create": True,
            "campaign.view_own": True,
            "booking.create": True,
            "creative.upload": True,
        },
    },
    {
        "name": "Sales Executive",
        "permissions": {
            "campaign.view": True,
            "quotation.create": True,
            "quotation.update": True,
            "booking.view": True,
        },
    },
    {
        "name": "Space Manager",
        "permissions": {
            "space.create": True,
            "space.update": True,
            "space.view": True,
            "availability.manage": True,
        },
    },
    {
        "name": "Creative Reviewer",
        "permissions": {
            "creative.view": True,
            "creative.approve": True,
            "creative.reject": True,
        },
    },
    {
        "name": "Finance Officer",
        "permissions": {
            "invoice.view": True,
            "payment.view": True,
            "payment.verify": True,
        },
    },
    {
        "name": "Administrator",
        "permissions": {
            "user.manage": True,
            "role.manage": True,
            "system.manage": True,
            "audit.view": True,
        },
    },
]


def seed_roles():
    """
    Insert the project's default roles into the database.

    Existing roles are skipped so that running this function
    multiple times doesn't create duplicate records.
    """

    for role_data in ROLES:

        # Check whether this role already exists.
        existing_role = Role.query.filter_by(
            name=role_data["name"]
        ).first()

        # Don't create a duplicate if the role already exists.
        if existing_role:
            continue

        # Create a new Role object.
        role = Role(
            name=role_data["name"],
            permissions=role_data["permissions"],
        )

        # Add the new role to SQLAlchemy's session.
        db.session.add(role)

    # Save all new roles to PostgreSQL.
    db.session.commit()