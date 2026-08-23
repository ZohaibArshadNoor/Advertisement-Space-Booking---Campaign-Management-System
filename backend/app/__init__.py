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

    @app.get("/")
    def health_check():
        """
        Checks that Flask is running.
        """
        return {
            "success": True,
            "message": "Advertisement Booking API is running"
        }

    @app.cli.command("seed")
    def seed():
        """
        Seed required reference data into the database.
        """
        from app.seed.seed_data import seed_roles

        seed_roles()

        click.echo("Database seed completed successfully.")

    return app