from flask_cors import CORS
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)

    # Initialize extensions
    from .routes import routes_bp
    app.register_blueprint(routes_bp)
    # Register blueprints
    from .auth import auth_bp
    app.register_blueprint(auth_bp)
   


    return app


