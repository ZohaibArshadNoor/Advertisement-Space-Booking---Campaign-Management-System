import click

from flask import Flask
from flasgger import Swagger

from config import Config
from app.auth import auth_bp
from app.extensions import db, migrate, jwt


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