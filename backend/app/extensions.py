from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy


# SQLAlchemy database instance.
#
# The database isn't connected to Flask here.
# The connection happens inside create_app().
db = SQLAlchemy()


# Flask-Migrate handles database schema migrations.
migrate = Migrate()


# Flask-Login will handle authentication-related functionality.
#
# JWT will later be the main authentication mechanism
# for our React API.
login_manager = LoginManager()