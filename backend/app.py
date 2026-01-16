import os
from flask import Flask
from flask_cors import CORS
from extensions import db, jwt 

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "super-secret-key")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    with app.app_context():
        # Import Blueprints inside context to avoid circularity
        from routes import routes_bp
        from auth import auth_bp
        
        app.register_blueprint(routes_bp)
        app.register_blueprint(auth_bp)
        
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    #  0.0.0.0 to ensure it's accessible in Docker or Cloud environments
    app.run(debug=True, host="0.0.0.0", port=5000)