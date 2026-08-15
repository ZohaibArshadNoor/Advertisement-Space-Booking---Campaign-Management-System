from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy


# SQLAlchemy database object.
#
# We create it here but do NOT connect it to Flask yet.
# The connection happens inside the application factory.
db = SQLAlchemy()


# Handles database schema migrations.
migrate = Migrate()


# Handles authentication-related functionality.
#
# We will configure this properly when we build authentication.
login_manager = LoginManager()