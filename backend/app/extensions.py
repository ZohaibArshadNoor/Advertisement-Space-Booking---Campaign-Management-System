from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# SQLAlchemy database instance.
#
# The database isn't connected to Flask here.
# The connection happens inside create_app().
db = SQLAlchemy()

# Flask-Migrate handles database schema migrations.
migrate = Migrate()

# Flask-JWT-Extended will handle JWT authentication for our API.
jwt = JWTManager()


