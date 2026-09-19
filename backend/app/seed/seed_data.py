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
    {
        "name": "Influencer",
        "permissions": {
            "influencer.portal": True,
            "influencer.view_own": True,
            "influencer.submit_deliverables": True,
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
    ensure_schema_migrations()


def ensure_schema_migrations():
    """
    Ensures that newly added columns exist in the PostgreSQL database if the table was created previously.
    """
    from sqlalchemy import text
    statements = [
        "ALTER TABLE hired_influencers ADD COLUMN IF NOT EXISTS submission_url VARCHAR(500);",
        "ALTER TABLE hired_influencers ADD COLUMN IF NOT EXISTS submission_notes TEXT;",
        "ALTER TABLE hired_influencers ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITHOUT TIME ZONE;",
        "ALTER TABLE hired_influencers ADD COLUMN IF NOT EXISTS revision_notes TEXT;",
        "ALTER TABLE hired_influencers ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITHOUT TIME ZONE;",
    ]
    for s in statements:
        try:
            db.session.execute(text(s))
        except Exception:
            pass
    db.session.commit()