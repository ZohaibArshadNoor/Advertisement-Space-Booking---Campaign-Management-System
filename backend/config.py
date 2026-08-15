import os

from dotenv import load_dotenv

# Load variables from the .env file into the environment.
load_dotenv()


class Config:
    """
    Base configuration for the Flask application.

    Keeping configuration in one class makes it easier to manage
    development, testing, and production environments later.
    """

    # Secret key used by Flask for security-related operations.
    SECRET_KEY = os.getenv("SECRET_KEY", "development-secret-key")

    # PostgreSQL database connection URL.
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

    # Disable SQLAlchemy's event system because we don't need it.
    # This also avoids unnecessary memory usage.
    SQLALCHEMY_TRACK_MODIFICATIONS = False