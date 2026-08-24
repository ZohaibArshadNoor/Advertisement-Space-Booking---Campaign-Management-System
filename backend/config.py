import os
from datetime import timedelta
from dotenv import load_dotenv

# Load variables from the .env file.
load_dotenv()


class Config:
    """
    Base configuration for the Advertisement Booking system.
    """
    # Secret key used by Flask for session and cryptographic signing.
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-me")

    # PostgreSQL database connection URL.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgre123@localhost:5432/adbooking"
    )

    # Disable SQLAlchemy event system to save memory.
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Authentication settings.
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "dev-insecure-jwt-secret-change-me"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "8"))
    )

    # Media & File Upload settings.
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 50 * 1024 * 1024))  # 50 MB
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads/creatives")

    # CORS Allowed Origins.
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
        if origin.strip()
    ]


class DevelopmentConfig(Config):
    """
    Development configuration with debug mode enabled.
    """
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """
    Testing configuration with isolated test database.
    """
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "postgresql://postgres:postgre123@localhost:5432/adbooking_test"
    )


class ProductionConfig(Config):
    """
    Hardened Production configuration with debug disabled and strict checks.
    """
    DEBUG = False
    TESTING = False

    # In production, require strict secrets.
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")


# Configuration mapping dictionary.
config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}