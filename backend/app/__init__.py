from flask import Flask

from config import Config
from app.extensions import db, migrate, login_manager


def create_app(config_class=Config):
    """
    Application factory.

    Creates and configures a Flask application instance.
    """

    # Create the Flask application.
    app = Flask(__name__)

    # Load configuration from the Config class.
    app.config.from_object(config_class)

    # Initialize SQLAlchemy with this Flask application.
    db.init_app(app)

    # Initialize Flask-Migrate.
    migrate.init_app(app, db)

    # Initialize Flask-Login.
    login_manager.init_app(app)

    @app.get("/")
    def health_check():
        """
        Simple endpoint used to verify that the backend is running.
        """

        return {
            "success": True,
            "message": "Advertisement Booking API is running"
        }

    return app