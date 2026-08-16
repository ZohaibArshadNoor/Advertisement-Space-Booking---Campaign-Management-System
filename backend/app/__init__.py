from app import models
import click
from app.auth import auth_bp
from flasgger import Swagger

from flask import Flask
from config import Config
from app.extensions import db, migrate


def create_app(config_class=Config):
    """
    Application factory.

    Creates and configures a Flask application instance.
    """

    # Create the Flask application.
    app = Flask(__name__)

    # Initialize Swagger for API documentation.
    Swagger(app)

    # Load configuration from the configuration class.
    app.config.from_object(config_class)

    # Initialize SQLAlchemy.
    db.init_app(app)

    # Initialize Flask-Migrate.
    migrate.init_app(app, db)


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