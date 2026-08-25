from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.role import Role
from app.models.user import User
from app.models.space import Location, SpaceCategory, AdvertisingSpace, SpaceAvailability
from app.models.advertiser import Advertiser, AdvertiserContact
from app.models.campaign import Campaign, CampaignStatus
from app.models.booking import Booking, BookingStatus
from app.models.payment import Invoice, InvoiceStatus, Payment, PaymentStatus, PaymentMethod
from app.models.creative import Creative, MediaStatus
from app.models.notification import Notification, NotificationType


def seed_demo_data():
    """
    Populates rich, realistic demo data across all modules for testing and UI demonstration.
    """
    print("[SEED] Starting demo data seeding...")

    # -------------------------------------------------------------------------
    # 1. ROLES & USERS
    # -------------------------------------------------------------------------
    from app.seed.seed_data import seed_roles
    seed_roles()

    roles = {r.name: r for r in Role.query.all()}
    password_hash = generate_password_hash("password123")

    # 1.1 Seed Advertiser Company
    advertiser_org = Advertiser.query.filter_by(company_name="Jazz Digital Telecommunications").first()
    if not advertiser_org:
        advertiser_org = Advertiser(
            company_name="Jazz Digital Telecommunications",
            email="contact@jazz.com.pk",
            phone="+92 51 111300300",
            address="F-8 Markaz",
            city="Islamabad",
            country="Pakistan",
            is_active=True
        )
        db.session.add(advertiser_org)
        db.session.flush()

        contact = AdvertiserContact(
            advertiser_id=advertiser_org.id,
            name="Ali Hassan",
            email="ali.hassan@jazz.com.pk",
            phone="+92 300 1234567",
            designation="Head of Brand Marketing",
            is_primary=True
        )
        db.session.add(contact)

    # 1.2 Seed Users across all 6 roles
    users_data = [
        {"email": "admin@test.com", "name": "System Administrator", "role": "Administrator"},
        {"email": "advertiser@test.com", "name": "Ali Hassan (Jazz Marketing)", "role": "Advertiser", "advertiser_id": advertiser_org.id},
        {"email": "spaces@test.com", "name": "Tariq Mahmood", "role": "Space Manager"},
        {"email": "finance@test.com", "name": "Farhan Siddiqui", "role": "Finance Officer"},
        {"email": "sales@test.com", "name": "Sara Khan", "role": "Sales Executive"},
        {"email": "reviewer@test.com", "name": "Zainab Malik", "role": "Creative Reviewer"},
    ]

    users_map = {}
    for u in users_data:
        user = User.query.filter_by(email=u["email"]).first()
        if not user:
            user = User(
                email=u["email"],
                name=u["name"],
                password_hash=password_hash,
                role_id=roles[u["role"]].id,
                advertiser_id=u.get("advertiser_id"),
                is_active=True
            )
            db.session.add(user)
            db.session.flush()
        users_map[u["role"]] = user

    # -------------------------------------------------------------------------
    # 2. LOCATIONS
    # -------------------------------------------------------------------------
    locations_data = [
        {"name": "Shahrah-e-Faisal Flyover A1", "address": "Main Shahrah-e-Faisal near Nursery", "city": "Karachi", "latitude": Decimal("24.8607"), "longitude": Decimal("67.0681")},
        {"name": "Clifton Sea View Boulevard", "address": "Block 4 Clifton Sea View", "city": "Karachi", "latitude": Decimal("24.7950"), "longitude": Decimal("67.0340")},
        {"name": "Gulberg Main Boulevard Liberty", "address": "Liberty Roundabout Gulberg III", "city": "Lahore", "latitude": Decimal("31.5102"), "longitude": Decimal("74.3441")},
        {"name": "DHA Phase 5 Commercial Ring Road", "address": "Bedian Road Interchange DHA Phase 5", "city": "Lahore", "latitude": Decimal("31.4697"), "longitude": Decimal("74.4124")},
        {"name": "Blue Area Jinnah Avenue", "address": "Jinnah Avenue Blue Area Sector G-6", "city": "Islamabad", "latitude": Decimal("33.7167"), "longitude": Decimal("73.0667")},
        {"name": "Centaurus Flyover LED Zone", "address": "Jinnah Avenue opposite Centaurus Mall", "city": "Islamabad", "latitude": Decimal("33.7077"), "longitude": Decimal("73.0501")},
    ]

    locations_map = {}
    for loc_data in locations_data:
        loc = Location.query.filter_by(name=loc_data["name"]).first()
        if not loc:
            loc = Location(**loc_data)
            db.session.add(loc)
            db.session.flush()
        locations_map[loc.name] = loc

    # -------------------------------------------------------------------------
    # 3. SPACE CATEGORIES (Only 'name' field in schema)
    # -------------------------------------------------------------------------
    categories_data = [
        "Digital 4K LED Screen",
        "Static Highway Unipole",
        "Mall Digital Display",
        "Transit Bus Shelter Display"
    ]

    categories_map = {}
    for cat_name in categories_data:
        cat = SpaceCategory.query.filter_by(name=cat_name).first()
        if not cat:
            cat = SpaceCategory(name=cat_name)
            db.session.add(cat)
            db.session.flush()
        categories_map[cat.name] = cat

    # -------------------------------------------------------------------------
    # 4. ADVERTISING SPACES
    # -------------------------------------------------------------------------
    spaces_data = [
        {
            "name": "Shahrah-e-Faisal Mega LED A1",
            "category_name": "Digital 4K LED Screen",
            "location_name": "Shahrah-e-Faisal Flyover A1",
            "description": "Massive 60ft x 20ft 4K curved LED billboard overlooking peak Karachi traffic toward Airport.",
            "dimensions": "60x20 ft",
            "base_rate": Decimal("1500000.00"),
            "is_active": True
        },
        {
            "name": "Liberty Roundabout Iconic Unipole",
            "category_name": "Static Highway Unipole",
            "location_name": "Gulberg Main Boulevard Liberty",
            "description": "Triple-sided front-lit static unipole commanding the entrance to Liberty Market.",
            "dimensions": "45x15 ft",
            "base_rate": Decimal("850000.00"),
            "is_active": True
        },
        {
            "name": "Centaurus High-Definition LED Display",
            "category_name": "Digital 4K LED Screen",
            "location_name": "Centaurus Flyover LED Zone",
            "description": "Premium illuminated LED screen located directly facing Faisal Mosque interchange traffic.",
            "dimensions": "40x20 ft",
            "base_rate": Decimal("1200000.00"),
            "is_active": True
        },
        {
            "name": "Clifton Beachfront Poster Panel",
            "category_name": "Transit Bus Shelter Display",
            "location_name": "Clifton Sea View Boulevard",
            "description": "Dual-sided illuminated transit poster board targeting weekend family footfall.",
            "dimensions": "6x4 ft",
            "base_rate": Decimal("350000.00"),
            "is_active": True
        }
    ]

    spaces_map = {}
    for sp_data in spaces_data:
        sp = AdvertisingSpace.query.filter_by(name=sp_data["name"]).first()
        if not sp:
            sp = AdvertisingSpace(
                name=sp_data["name"],
                category_id=categories_map[sp_data["category_name"]].id,
                location_id=locations_map[sp_data["location_name"]].id,
                description=sp_data["description"],
                dimensions=sp_data["dimensions"],
                base_rate=sp_data["base_rate"],
                is_active=sp_data["is_active"]
            )
            db.session.add(sp)
            db.session.flush()
        spaces_map[sp.name] = sp

    # -------------------------------------------------------------------------
    # 5. CAMPAIGNS
    # -------------------------------------------------------------------------
    adv_user = users_map["Advertiser"]
    campaign_data = [
        {
            "name": "Super 4G Mega Data Summer Campaign",
            "description": "National high-frequency billboard blitz promoting summer mobile internet packages.",
            "budget": Decimal("5000000.00"),
            "start_date": date.today() - timedelta(days=15),
            "end_date": date.today() + timedelta(days=45),
            "status": CampaignStatus.ACTIVE
        },
        {
            "name": "JazzCash Digital Wallet Autumn Promo",
            "description": "Financial awareness transit shelter campaign promoting zero transaction fees.",
            "budget": Decimal("2500000.00"),
            "start_date": date.today() + timedelta(days=30),
            "end_date": date.today() + timedelta(days=90),
            "status": CampaignStatus.DRAFT
        }
    ]

    campaigns_map = {}
    for c_data in campaign_data:
        camp = Campaign.query.filter_by(name=c_data["name"]).first()
        if not camp:
            camp = Campaign(
                user_id=adv_user.id,
                advertiser_id=advertiser_org.id,
                name=c_data["name"],
                description=c_data["description"],
                budget=c_data["budget"],
                start_date=c_data["start_date"],
                end_date=c_data["end_date"],
                status=c_data["status"]
            )
            db.session.add(camp)
            db.session.flush()
        campaigns_map[camp.name] = camp

    # -------------------------------------------------------------------------
    # 6. BOOKINGS & AVAILABILITY
    # -------------------------------------------------------------------------
    space1 = spaces_map["Shahrah-e-Faisal Mega LED A1"]
    active_camp = campaigns_map["Super 4G Mega Data Summer Campaign"]

    b_start = date.today() - timedelta(days=10)
    b_end = date.today() + timedelta(days=20)

    booking = Booking.query.filter_by(space_id=space1.id, user_id=adv_user.id).first()
    if not booking:
        booking = Booking(
            user_id=adv_user.id,
            advertiser_id=advertiser_org.id,
            space_id=space1.id,
            campaign_id=active_camp.id,
            start_date=b_start,
            end_date=b_end,
            total_price=Decimal("1500000.00"),
            status=BookingStatus.CONFIRMED,
            notes="Exclusive prime-time slot reservation."
        )
        db.session.add(booking)
        db.session.flush()

        avail = SpaceAvailability(
            space_id=space1.id,
            start_date=b_start,
            end_date=b_end,
            is_booked=True
        )
        db.session.add(avail)

    # -------------------------------------------------------------------------
    # 7. INVOICES & PAYMENTS
    # -------------------------------------------------------------------------
    invoice = Invoice.query.filter_by(campaign_id=active_camp.id).first()
    if not invoice:
        subtotal = Decimal("1500000.00")
        tax = Decimal("240000.00")  # 16% SST
        total = subtotal + tax

        invoice = Invoice(
            campaign_id=active_camp.id,
            advertiser_id=advertiser_org.id,
            subtotal=subtotal,
            tax=tax,
            total_amount=total,
            due_date=date.today() + timedelta(days=15),
            status=InvoiceStatus.PARTIALLY_PAID
        )
        db.session.add(invoice)
        db.session.flush()

        payment = Payment(
            invoice_id=invoice.id,
            amount=Decimal("1000000.00"),
            payment_method=PaymentMethod.BANK_TRANSFER,
            transaction_reference="FT-PK-2026-889021",
            status=PaymentStatus.COMPLETED,
            paid_at=datetime.now(timezone.utc) - timedelta(days=5)
        )
        db.session.add(payment)

    # -------------------------------------------------------------------------
    # 8. MEDIA ASSETS
    # -------------------------------------------------------------------------
    creative = Creative.query.filter_by(campaign_id=active_camp.id).first()
    if not creative:
        creative = Creative(
            campaign_id=active_camp.id,
            uploaded_by=adv_user.id,
            filename="demo_summer_4g_banner_hd.png",
            original_filename="jazz_4g_summer_billboard_60x20.png",
            file_path="uploads/creatives/demo_summer_4g_banner_hd.png",
            file_type="image/png",
            file_size=4194304,
            dimensions="1920x1080",
            status=MediaStatus.APPROVED,
            reviewed_by=users_map["Creative Reviewer"].id,
            reviewed_at=datetime.now(timezone.utc) - timedelta(days=8)
        )
        db.session.add(creative)

    # -------------------------------------------------------------------------
    # 9. NOTIFICATIONS
    # -------------------------------------------------------------------------
    notif = Notification.query.filter_by(user_id=adv_user.id).first()
    if not notif:
        db.session.add(
            Notification(
                user_id=adv_user.id,
                type=NotificationType.BOOKING,
                title="Booking Confirmed",
                message="Your booking BK-A8F210 for Shahrah-e-Faisal Mega LED A1 is confirmed.",
                link=f"/bookings/{booking.id}",
                is_read=False
            )
        )
        db.session.add(
            Notification(
                user_id=adv_user.id,
                type=NotificationType.PAYMENT,
                title="Payment Received",
                message="PKR 1,000,000 payment received via Bank Transfer for Invoice INV-2026-0001.",
                link=f"/invoices/{invoice.id}",
                is_read=True
            )
        )

    db.session.commit()
    print("[SEED] Demo data seeded successfully!")
    print("\n[AUTH] Ready Test Accounts (Password: 'password123'):")
    for role_name, user_obj in users_map.items():
        print(f"  * {role_name:18} -> {user_obj.email}")
