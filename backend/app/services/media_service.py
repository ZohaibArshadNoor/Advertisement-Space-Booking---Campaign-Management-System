import os
import uuid
from datetime import datetime, timezone
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

from app.extensions import db
from app.models.creative import Creative, MediaStatus
from app.models.campaign import Campaign
from app.services.audit_service import AuditService
from app.models.audit import AuditAction
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType

# Permitted upload formats
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "mp4", "pdf"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads", "creatives")


class MediaService:
    """
    Handles file upload validation, physical storage on disk,
    database tracking, and approval workflows.
    """

    @staticmethod
    def _is_allowed_file(filename: str) -> bool:
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def upload_for_campaign(
        campaign_id: int,
        user_id: int,
        file: FileStorage,
        dimensions: str = None
    ):
        """
        Validates, saves to disk, and records an uploaded creative file.
        """
        campaign = db.session.get(Campaign, campaign_id)
        if not campaign:
            return None, "Campaign not found."

        if not file or not file.filename:
            return None, "No file provided."

        if not MediaService._is_allowed_file(file.filename):
            return None, f"File format not allowed. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"

        # Ensure upload folder exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        original_filename = secure_filename(file.filename)
        extension = original_filename.rsplit(".", 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex[:12]}_{original_filename}"
        full_disk_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        # Save to disk
        file.save(full_disk_path)
        file_size = os.path.getsize(full_disk_path)

        if file_size > MAX_FILE_SIZE:
            os.remove(full_disk_path)
            return None, "File exceeds the maximum limit of 50 MB."

        # MIME type
        file_type = file.mimetype or f"application/{extension}"

        # Create database record
        creative = Creative(
            campaign_id=campaign.id,
            uploaded_by=user_id,
            filename=unique_filename,
            original_filename=original_filename,
            file_path=os.path.relpath(full_disk_path, os.getcwd()),
            file_type=file_type,
            file_size=file_size,
            dimensions=dimensions,
            status=MediaStatus.PENDING
        )

        db.session.add(creative)
        db.session.commit()

        # Audit log
        AuditService.log(
            user_id=user_id,
            action=AuditAction.CREATE,
            entity_type="MediaAsset",
            entity_id=creative.id,
            new_values={
                "media_reference": creative.media_reference,
                "campaign_id": creative.campaign_id,
                "filename": creative.original_filename,
                "file_size": creative.file_size
            }
        )

        return creative, None

    @staticmethod
    def get_by_id(media_id: int):
        return db.session.get(Creative, media_id)

    @staticmethod
    def get_by_campaign(campaign_id: int):
        return Creative.query.filter_by(campaign_id=campaign_id).order_by(
            Creative.created_at.desc()
        ).all()

    @staticmethod
    def update_status(
        creative: Creative,
        new_status: str,
        reviewer_id: int,
        rejection_reason: str = None
    ):
        """
        Approves or rejects a media asset, sending an in-app notification to the uploader.
        """
        if new_status not in [MediaStatus.APPROVED, MediaStatus.REJECTED]:
            return None, "Status must be either APPROVED or REJECTED."

        old_status = creative.status
        creative.status = new_status
        creative.reviewed_by = reviewer_id
        creative.reviewed_at = datetime.now(timezone.utc)
        creative.rejection_reason = rejection_reason if new_status == MediaStatus.REJECTED else None

        db.session.commit()

        # Send notification to uploader
        status_msg = "approved for execution" if new_status == MediaStatus.APPROVED else f"rejected: {rejection_reason}"
        try:
            NotificationService.send_notification(
                user_id=creative.uploaded_by,
                title=f"Creative Asset {new_status.capitalize()}",
                message=f"Your creative '{creative.original_filename}' for campaign '{creative.campaign.name}' was {status_msg}.",
                notification_type=NotificationType.CAMPAIGN,
                link=f"/campaigns/{creative.campaign_id}"
            )
        except Exception:
            pass

        # Record audit log
        AuditService.log(
            user_id=reviewer_id,
            action=AuditAction.UPDATE_STATUS,
            entity_type="MediaAsset",
            entity_id=creative.id,
            old_values={"status": old_status},
            new_values={"status": new_status, "rejection_reason": rejection_reason}
        )

        return creative, None

    @staticmethod
    def delete(creative: Creative, actor_id: int = None):
        """
        Deletes the database record and removes the file from disk.
        """
        full_path = os.path.join(os.getcwd(), creative.file_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception:
                pass

        AuditService.log(
            user_id=actor_id,
            action=AuditAction.DELETE,
            entity_type="MediaAsset",
            entity_id=creative.id,
            old_values={"original_filename": creative.original_filename}
        )

        db.session.delete(creative)
        db.session.commit()
        return True
