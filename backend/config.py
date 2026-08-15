import os

from dotenv import load_dotenv


# Load variables from the .env file.
load_dotenv()


class Config:
    """
    Base configuration for the Advertisement Booking system.
    """

    # Secret key used by Flask for security-related operations.
    SECRET_KEY = os.getenv("SECRET_KEY")

    # PostgreSQL database connection URL.
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

    # We don't need SQLAlchemy's event tracking system.
    SQLALCHEMY_TRACK_MODIFICATIONS = False