from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models.campaign import Campaign, CampaignStatus
from app.models.audit import AuditAction
from app.services.audit_service import AuditService


class CampaignService:
    """
    Handles business logic for advertising campaigns.
    """

    @staticmethod
    def get_by_id(campaign_id: int):
        """
        Returns a single campaign by primary key.
        """
        return db.session.get(Campaign, campaign_id)

    @staticmethod
    def get_by_reference(campaign_reference: str):
        """
        Returns a campaign by its unique reference string.
        """
        return Campaign.query.filter_by(
            campaign_reference=campaign_reference
        ).first()

    @staticmethod
    def get_all(
        page=1,
        per_page=10,
        user_id=None,
        advertiser_id=None,
        status=None,
        start_date=None,
        end_date=None,
        min_budget=None,
        max_budget=None,
        search=None,
        sort_by="created_at",
        sort_order="desc"
    ):
        """
        Returns paginated campaigns with advanced multi-criteria filtering,
        keyword search, budget limits, and whitelisted sorting.
        """
        from sqlalchemy.orm import joinedload

        query = Campaign.query.options(
            joinedload(Campaign.advertiser),
            joinedload(Campaign.user)
        )

        # 1. Filter by owner user ID
        if user_id is not None:
            query = query.filter(Campaign.user_id == user_id)

        # 2. Filter by advertiser company ID
        if advertiser_id is not None:
            query = query.filter(Campaign.advertiser_id == advertiser_id)

        # 3. Filter by status
        if status:
            query = query.filter(Campaign.status == status)

        # 4. Date boundaries
        if start_date is not None:
            query = query.filter(Campaign.start_date >= start_date)
        if end_date is not None:
            query = query.filter(Campaign.end_date <= end_date)

        # 5. Budget range
        if min_budget is not None:
            query = query.filter(Campaign.budget >= min_budget)
        if max_budget is not None:
            query = query.filter(Campaign.budget <= max_budget)

        # 6. Keyword search (name, description, reference)
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                db.or_(
                    Campaign.name.ilike(search_term),
                    Campaign.description.ilike(search_term),
                    Campaign.campaign_reference.ilike(search_term)
                )
            )

        # 7. Whitelisted sorting
        sort_fields = {
            "created_at": Campaign.created_at,
            "name": Campaign.name,
            "start_date": Campaign.start_date,
            "budget": Campaign.budget,
            "status": Campaign.status
        }
        sort_column = sort_fields.get(sort_by, Campaign.created_at)
        if str(sort_order).lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # 8. Capped pagination
        safe_per_page = min(max(1, per_page), 100)
        safe_page = max(1, page)

        return query.paginate(
            page=safe_page,
            per_page=safe_per_page,
            error_out=False
        )

    @staticmethod
    def create(
        user_id: int,
        name: str,
        description=None,
        start_date=None,
        end_date=None,
        budget=None,
        advertiser_id=None
    ):
        """
        Creates a new campaign in DRAFT status.
        """
        campaign = Campaign(
            user_id=user_id,
            advertiser_id=advertiser_id,
            name=name.strip(),
            description=description.strip() if description else None,
            start_date=start_date,
            end_date=end_date,
            budget=budget,
            status=CampaignStatus.DRAFT
        )

        db.session.add(campaign)
        db.session.commit()

        try:
            AuditService.log(
                user_id=user_id,
                action=AuditAction.CREATE,
                entity_type="Campaign",
                entity_id=campaign.id,
                new_values={
                    "campaign_reference": campaign.campaign_reference,
                    "name": campaign.name,
                    "advertiser_id": campaign.advertiser_id,
                    "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
                    "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
                    "budget": str(campaign.budget),
                    "status": campaign.status
                }
            )
        except Exception:
            pass

        return campaign

    @staticmethod
    def update(campaign: Campaign, data: dict, user_id=None):
        """
        Updates campaign attributes.
        """
        old_values = {
            "name": campaign.name,
            "description": campaign.description,
            "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
            "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
            "budget": str(campaign.budget)
        }

        if "name" in data:
            campaign.name = data["name"].strip()

        if "description" in data:
            campaign.description = data["description"].strip() if data["description"] else None

        if "start_date" in data:
            campaign.start_date = data["start_date"]

        if "end_date" in data:
            campaign.end_date = data["end_date"]

        if "budget" in data:
            campaign.budget = data["budget"]

        db.session.commit()

        try:
            AuditService.log(
                user_id=user_id,
                action=AuditAction.UPDATE,
                entity_type="Campaign",
                entity_id=campaign.id,
                old_values=old_values,
                new_values={
                    "name": campaign.name,
                    "description": campaign.description,
                    "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
                    "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
                    "budget": str(campaign.budget)
                }
            )
        except Exception:
            pass

        return campaign

    @staticmethod
    def update_status(campaign: Campaign, new_status: str, user_id=None):
        """
        Updates the campaign lifecycle status.
        """
        if new_status not in CampaignStatus.ALL:
            return None, f"Invalid status. Must be one of {CampaignStatus.ALL}"

        old_status = campaign.status
        campaign.status = new_status
        db.session.commit()

        try:
            AuditService.log(
                user_id=user_id,
                action=AuditAction.UPDATE_STATUS,
                entity_type="Campaign",
                entity_id=campaign.id,
                old_values={"status": old_status, "campaign_reference": campaign.campaign_reference},
                new_values={"status": campaign.status, "campaign_reference": campaign.campaign_reference}
            )
        except Exception:
            pass

        return campaign, None

    @staticmethod
    def delete(campaign: Campaign, user_id=None):
        """
        Deletes a campaign, releases linked availability blocks,
        and ensures no active financial invoices exist.
        """
        from app.models.payment import Invoice, InvoiceStatus
        from app.models.space import SpaceAvailability
        from app.models.booking import BookingStatus

        # 1. Prevent deleting campaigns with active or settled invoices
        active_invoices = Invoice.query.filter(
            Invoice.campaign_id == campaign.id,
            Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID])
        ).count()

        if active_invoices > 0:
            return False, "Cannot delete a campaign with active or paid invoices."

        campaign_id = campaign.id
        campaign_ref = campaign.campaign_reference
        campaign_name = campaign.name

        try:
            # 2. Release space availability blocks for any confirmed bookings
            for booking in campaign.bookings:
                if booking.status == BookingStatus.CONFIRMED:
                    SpaceAvailability.query.filter_by(
                        space_id=booking.space_id,
                        start_date=booking.start_date,
                        end_date=booking.end_date,
                        is_booked=True
                    ).delete()

            # 3. Delete campaign (cascades to bookings & creatives)
            db.session.delete(campaign)
            db.session.commit()

            try:
                AuditService.log(
                    user_id=user_id,
                    action=AuditAction.DELETE,
                    entity_type="Campaign",
                    entity_id=campaign_id,
                    old_values={"campaign_reference": campaign_ref, "name": campaign_name}
                )
            except Exception:
                pass

        except Exception as err:
            db.session.rollback()
            return False, f"Failed to delete campaign: {str(err)}"

        return True, None