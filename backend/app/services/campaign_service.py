from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models.campaign import Campaign, CampaignStatus


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
        status=None
    ):
        """
        Returns paginated campaigns with optional role-based filtering.
        """
        query = Campaign.query

        if user_id is not None:
            query = query.filter(Campaign.user_id == user_id)

        if advertiser_id is not None:
            query = query.filter(Campaign.advertiser_id == advertiser_id)

        if status:
            query = query.filter(Campaign.status == status)

        return query.order_by(
            Campaign.created_at.desc()
        ).paginate(
            page=page,
            per_page=per_page,
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

        return campaign

    @staticmethod
    def update(campaign: Campaign, data: dict):
        """
        Updates campaign attributes.
        """
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
        return campaign

    @staticmethod
    def update_status(campaign: Campaign, new_status: str):
        """
        Updates the campaign lifecycle status.
        """
        if new_status not in CampaignStatus.ALL:
            return None, f"Invalid status. Must be one of {CampaignStatus.ALL}"

        campaign.status = new_status
        db.session.commit()
        return campaign, None

    @staticmethod
    def delete(campaign: Campaign):
        """
        Deletes a campaign and cascades deletion to linked bookings.
        """
        db.session.delete(campaign)
        db.session.commit()
        return True