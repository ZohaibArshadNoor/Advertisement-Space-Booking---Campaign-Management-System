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
from app.models.influencer import Influencer


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
        {"name": "Meta Ads Manager Network (Facebook & Instagram)", "address": "Meta Global Ad Network", "city": "Digital Network", "latitude": Decimal("24.8607"), "longitude": Decimal("67.0681")},
        {"name": "YouTube Video Network & Google Ads", "address": "Google Video Partner Network", "city": "Digital Network", "latitude": Decimal("31.5102"), "longitude": Decimal("74.3441")},
        {"name": "Agency Creator & Influencer Roster", "address": "Verified Digital Creators Network", "city": "Digital Network", "latitude": Decimal("33.7167"), "longitude": Decimal("73.0667")},
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
        "Transit Bus Shelter Display",
        "Social Media Marketing (Meta & Instagram)",
        "YouTube Video Advertising",
        "Influencer & Creator Sponsorship",
        "Programmatic Display Network"
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
    # 4. ADVERTISING SPACES & DIGITAL MARKETING AGENCY SERVICES
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
        },
        {
            "name": "Meta Social Growth Flight (Facebook & Instagram Feed + Reels)",
            "category_name": "Social Media Marketing (Meta & Instagram)",
            "location_name": "Meta Ads Manager Network (Facebook & Instagram)",
            "description": "Targeted Meta Ads campaign reaching 500,000+ active users with 9:16 Reels and 1:1 Feed carousel creative placements.",
            "dimensions": "1080x1920 (9:16) & 1080x1080 (1:1)",
            "base_rate": Decimal("350000.00"),
            "is_active": True
        },
        {
            "name": "YouTube 30s 4K Video Pre-Roll & In-Stream Campaign",
            "category_name": "YouTube Video Advertising",
            "location_name": "YouTube Video Network & Google Ads",
            "description": "High-impact non-skippable & skippable 1080p/4K video ad flight placed across top trending Pakistani YouTube channels.",
            "dimensions": "1920x1080 (16:9 4K Video)",
            "base_rate": Decimal("550000.00"),
            "is_active": True
        },
        {
            "name": "Tech YouTuber Dedicated Review & Unboxing Sponsorship",
            "category_name": "Influencer & Creator Sponsorship",
            "location_name": "Agency Creator & Influencer Roster",
            "description": "Full dedicated 8-10 minute YouTube sponsorship video + pinned link in description by a verified Tech creator (500k+ subs).",
            "dimensions": "16:9 Full HD Video + Link",
            "base_rate": Decimal("250000.00"),
            "is_active": True
        },
        {
            "name": "Lifestyle & Fashion Instagram Creator Collab Package",
            "category_name": "Influencer & Creator Sponsorship",
            "location_name": "Agency Creator & Influencer Roster",
            "description": "2 High-engagement Instagram Reels + 3 Interactive Stories with swipe-up product link by top lifestyle creators.",
            "dimensions": "1080x1920 (9:16 Video)",
            "base_rate": Decimal("180000.00"),
            "is_active": True
        },
        {
            "name": "Google High-Intent Search & Display Network Flight",
            "category_name": "Programmatic Display Network",
            "location_name": "YouTube Video Network & Google Ads",
            "description": "Multi-device web banner and keyword search ad flight with guaranteed 100,000+ targeted impressions.",
            "dimensions": "728x90 & 300x250 Banners",
            "base_rate": Decimal("220000.00"),
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

    # -------------------------------------------------------------------------
    # 10. INFLUENCERS & CREATOR MEDIA KITS
    # -------------------------------------------------------------------------
    influencers_data = [
        {
            "name": "Ali Raza",
            "handle": "@techwithali",
            "platform": "YouTube",
            "niche": "Tech & Gadgets",
            "bio": "Leading Pakistani tech reviewer covering smartphone unboxings, gadget teardowns, and software benchmarks.",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            "followers_count": 780000,
            "avg_views": 195000,
            "engagement_rate": Decimal("7.45"),
            "tier": "Macro Creator",
            "packages": [
                {
                    "id": "pkg_dedicated",
                    "title": "Dedicated 10-Min YouTube Review",
                    "deliverables": "Full dedicated video, technical benchmark test + pinned comment link",
                    "price": 250000
                },
                {
                    "id": "pkg_integrated",
                    "title": "60s Mid-Roll Video Integration",
                    "deliverables": "60s in-video organic shoutout + description affiliate link",
                    "price": 130000
                },
                {
                    "id": "pkg_shorts",
                    "title": "2 YouTube Shorts & Community Post",
                    "deliverables": "2 High-impact vertical YouTube shorts + Community tab banner",
                    "price": 95000
                }
            ],
            "portfolio_links": [
                {"title": "Jazz 5G Speed Test & Review", "url": "https://youtube.com/watch?v=demo1"},
                {"title": "Flagship Smartphone Unboxing", "url": "https://youtube.com/watch?v=demo2"}
            ],
            "is_verified": True,
            "is_available": True,
            "rating": Decimal("4.95"),
            "completed_campaigns": 24
        },
        {
            "name": "Ayesha & Zainab",
            "handle": "@fashiontwins_official",
            "platform": "Instagram",
            "niche": "Fashion & Lifestyle",
            "bio": "Lifestyle, haute couture & beauty creators inspiring 500k+ modern youth across Karachi & Lahore.",
            "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
            "followers_count": 520000,
            "avg_views": 120000,
            "engagement_rate": Decimal("8.20"),
            "tier": "Macro Creator",
            "packages": [
                {
                    "id": "pkg_reels",
                    "title": "2 Instagram Reels + 3 Stories",
                    "deliverables": "2 High-engagement aesthetic Reels + 3 swipe-up Stories",
                    "price": 180000
                },
                {
                    "id": "pkg_takeover",
                    "title": "1-Day Brand Takeover & Event Visit",
                    "deliverables": "On-site flagship store launch coverage + Live stream",
                    "price": 280000
                }
            ],
            "portfolio_links": [
                {"title": "Summer Lawn Collection Launch", "url": "https://instagram.com/p/demo1"}
            ],
            "is_verified": True,
            "is_available": True,
            "rating": Decimal("4.90"),
            "completed_campaigns": 38
        },
        {
            "name": "Chef Bilal",
            "handle": "@karachifoodguide",
            "platform": "YouTube",
            "niche": "Food & Culinary",
            "bio": "Street food explorer, restaurant critic, and FMCG brand partner covering Pakistan's top food culture.",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
            "followers_count": 640000,
            "avg_views": 160000,
            "engagement_rate": Decimal("6.90"),
            "tier": "Macro Creator",
            "packages": [
                {
                    "id": "pkg_restaurant",
                    "title": "Full Episode Food & Beverage Showcase",
                    "deliverables": "Dedicated 15-min episode featuring brand ingredients / venue",
                    "price": 220000
                },
                {
                    "id": "pkg_shoutout",
                    "title": "30s In-Video Tasting & Sponsor Link",
                    "deliverables": "30-second taste test integration + description link",
                    "price": 110000
                }
            ],
            "portfolio_links": [
                {"title": "Best Biryani in Burns Road", "url": "https://youtube.com/watch?v=demo3"}
            ],
            "is_verified": True,
            "is_available": True,
            "rating": Decimal("4.85"),
            "completed_campaigns": 19
        },
        {
            "name": "Hamza Tariq (Hamza Plays)",
            "handle": "@hamzaplays_pk",
            "platform": "YouTube",
            "niche": "Gaming & Esports",
            "bio": "Top esports streamer & gaming content creator with massive youth following in mobile & PC gaming.",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
            "followers_count": 910000,
            "avg_views": 250000,
            "engagement_rate": Decimal("9.10"),
            "tier": "Celebrity Creator",
            "packages": [
                {
                    "id": "pkg_stream",
                    "title": "2-Hour Sponsored Live Stream + Overlay",
                    "deliverables": "2-hour dedicated tournament stream + persistent banner logo overlay",
                    "price": 200000
                },
                {
                    "id": "pkg_tournament",
                    "title": "Community Cup Tournament Title Sponsor",
                    "deliverables": "Full naming rights for monthly 500-player community tournament",
                    "price": 450000
                }
            ],
            "portfolio_links": [
                {"title": "PUBG Mobile Pro Finals Stream", "url": "https://youtube.com/watch?v=demo4"}
            ],
            "is_verified": True,
            "is_available": True,
            "rating": Decimal("4.92"),
            "completed_campaigns": 42
        },
        {
            "name": "Dr. Saad Farooq",
            "handle": "@drsaad_fintech",
            "platform": "LinkedIn",
            "niche": "Business & Finance",
            "bio": "Venture partner & financial literacy leader providing corporate brand trust and executive audience reach.",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
            "followers_count": 180000,
            "avg_views": 45000,
            "engagement_rate": Decimal("5.60"),
            "tier": "Micro Creator",
            "packages": [
                {
                    "id": "pkg_article",
                    "title": "Thought Leadership Article & Dedicated Post",
                    "deliverables": "In-depth case study article on financial technology + LinkedIn post",
                    "price": 140000
                },
                {
                    "id": "pkg_webinar",
                    "title": "Keynote Speaker at Brand Webinar",
                    "deliverables": "45-min virtual keynote session for corporate clients",
                    "price": 250000
                }
            ],
            "portfolio_links": [
                {"title": "Future of Digital Banking in South Asia", "url": "https://linkedin.com/pulse/demo"}
            ],
            "is_verified": True,
            "is_available": True,
            "rating": Decimal("5.00"),
            "completed_campaigns": 15
        },
        {
            "name": "Zoya Malik",
            "handle": "@zoyatrends",
            "platform": "TikTok",
            "niche": "Fashion & Lifestyle",
            "bio": "Viral TikTok trendsetter & beauty ambassador reaching Gen-Z consumers nationwide with high engagement.",
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
            "followers_count": 1400000,
            "avg_views": 480000,
            "engagement_rate": Decimal("11.30"),
            "tier": "Celebrity Creator",
            "packages": [
                {
                    "id": "pkg_tiktok",
                    "title": "3 Viral TikTok Videos with Branded Hashtag",
                    "deliverables": "3 Creative 15-30s TikTok videos + branded sound usage",
                    "price": 220000
                },
                {
                    "id": "pkg_livetrip",
                    "title": "TikTok LIVE Brand Launch Session",
                    "deliverables": "1-Hour live shopping stream with pinned product cart links",
                    "price": 175000
                }
            ],
            "portfolio_links": [
                {"title": "Viral Skincare Routine Challenge", "url": "https://tiktok.com/@zoyatrends/video/demo"}
            ],
            "is_verified": True,
            "is_available": True,
            "rating": Decimal("4.88"),
            "completed_campaigns": 51
        }
    ]

    for inf_data in influencers_data:
        inf = Influencer.query.filter_by(handle=inf_data["handle"]).first()
        if not inf:
            inf = Influencer(**inf_data)
            db.session.add(inf)

    db.session.commit()
    print("[SEED] Demo data seeded successfully!")
    print("\n[AUTH] Ready Test Accounts (Password: 'password123'):")
    for role_name, user_obj in users_map.items():
        print(f"  * {role_name:18} -> {user_obj.email}")
