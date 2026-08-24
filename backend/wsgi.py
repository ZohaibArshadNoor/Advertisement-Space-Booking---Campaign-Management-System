import os
from config import config_by_name
from app import create_app

# Determine current environment (default to 'production' for WSGI runners)
env_name = os.getenv("FLASK_ENV", "production")
config_class = config_by_name.get(env_name, config_by_name["production"])

# Initialize WSGI application instance
app = create_app(config_class=config_class)

if __name__ == "__main__":
    app.run()
