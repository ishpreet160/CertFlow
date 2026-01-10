from flask_cors import CORS
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL") 
    
    db.init_app(app) 
    CORS(app)

    with app.app_context():
        from routes import routes_bp
        from auth import auth_bp
        app.register_blueprint(routes_bp)
        app.register_blueprint(auth_bp)

    return app
