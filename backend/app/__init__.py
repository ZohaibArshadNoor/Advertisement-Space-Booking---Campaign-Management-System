import os
from flask import Flask, jsonify
from config import config_by_name
from app.extensions import db, migrate, login_manager, cors

def create_app(config_name=None):
    """Application factory function."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")
        
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    
    # Health check & root API ping
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "Advertisement Space Booking & Campaign Management API is running",
            "version": "1.0.0"
        }), 200

    return app
