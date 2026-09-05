import click

from flask import Flask, app
from flasgger import Swagger

from config import Config
from app.auth import auth_bp
from app.extensions import db, migrate, jwt
from app.users import users_bp
from app.advertisers import advertisers_bp
from app.spaces import spaces_bp
from app.availability import availability_bp
from app.bookings import bookings_bp
from app.campaigns import campaigns_bp
from app.invoices import invoices_bp
from app.payments import payments_bp
from app.dashboard import dashboard_bp
from app.notifications import notifications_bp
from app.audit_logs import audit_logs_bp
from app.reports import reports_bp
from app.creatives import creatives_bp
from app.influencers import influencers_bp
from app.errors import register_error_handlers



def create_app(config_class=Config):
    """
    Application factory.

    Creates and configures a Flask application instance.
    """

    # Create the Flask application.
    app = Flask(__name__)

    # Load configuration from the configuration class.
    app.config.from_object(config_class)

    # Swagger configuration.
    swagger_config = Swagger.DEFAULT_CONFIG.copy()

    swagger_config.update({
        "title": "Advertisement Booking API",
        "description": "API documentation for the Advertisement Booking System",
        "version": "1.0.0",

        "specs": [
            {
                "endpoint": "apispec",
                "route": "/apispec.json",
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],

        "swagger_ui": True,
        "specs_route": "/apidocs/",
        "static_url_path": "/flasgger_static",
        "headers": [],

        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "Enter: Bearer <JWT access token>"
            }
        }
    })

    # Initialize Swagger.
    Swagger(app, config=swagger_config)

    # Initialize SQLAlchemy.
    db.init_app(app)

    # Initialize Flask-Migrate.
    migrate.init_app(app, db)

    # Initialize Flask-CORS with whitelisted origins.
    from flask_cors import CORS
    CORS(app, origins=app.config.get("CORS_ORIGINS", "*"), supports_credentials=True)

    # Initialize JWT.
    jwt.init_app(app)

    # Register the authentication Blueprint.
    app.register_blueprint(auth_bp)
    
    # Register the user management Blueprint.
    app.register_blueprint(users_bp)

    # Register the advertiser management Blueprint.
    app.register_blueprint(advertisers_bp)
    
    # Register the advertising space management Blueprint.
    app.register_blueprint(spaces_bp)

    # Register the space availability management Blueprint.
    app.register_blueprint(availability_bp)
    
    # Register the booking management Blueprint.
    app.register_blueprint(bookings_bp)

    # Register the campaign management Blueprint.
    app.register_blueprint(campaigns_bp)
    
    # Register the invoice management Blueprint.
    app.register_blueprint(invoices_bp)
    
    # Register the payment management Blueprint.
    app.register_blueprint(payments_bp)

    # Register the dashboard analytics Blueprint.
    app.register_blueprint(dashboard_bp)

    # Register the notifications management Blueprint.
    app.register_blueprint(notifications_bp)

    # Register the audit logs Blueprint.
    app.register_blueprint(audit_logs_bp)

    # Register the reports & analytics Blueprint.
    app.register_blueprint(reports_bp)

    # Register the media & creatives Blueprint.
    app.register_blueprint(creatives_bp)

    # Register the influencer & creator marketplace Blueprint.
    app.register_blueprint(influencers_bp)

    # Register centralized error handling & response middleware
    register_error_handlers(app)

    @app.get("/")
    def root_health():
        """
        Root health check.
        """
        return {
            "success": True,
            "message": "Advertisement Booking API is running"
        }

    @app.get("/api/health")
    def api_health():
        """
        Production health check endpoint verifying application and database connectivity.
        ---
        tags:
          - System & Health
        summary: Service health check
        responses:
          200:
            description: System and database are operational.
          503:
            description: Database connectivity failure.
        """
        from sqlalchemy import text
        db_status = "connected"
        http_status = 200
        try:
            db.session.execute(text("SELECT 1"))
        except Exception:
            db_status = "disconnected"
            http_status = 503

        return {
            "status": "healthy" if http_status == 200 else "unhealthy",
            "database": db_status,
            "version": "1.0.0"
        }, http_status

    @app.cli.command("seed")
    def seed():
        """
        Seed required reference data into the database.
        """
        from app.seed.seed_data import seed_roles
        seed_roles()
        click.echo("Database seed completed successfully.")

    @app.cli.command("seed-demo")
    def seed_demo():
        """
        Seed rich, realistic demo data across all modules.
        """
        from app.seed.seed_demo import seed_demo_data
        seed_demo_data()

    return app