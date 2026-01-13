from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from config import Config  
from extensions import db, jwt, mail
from routes import routes_bp
from auth import auth_bp

def create_app():

    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app,
     resources={r"/api/*": {"origins": "https://tcil-frontend.onrender.com"}},
     supports_credentials=True,
     methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     expose_headers=["Content-Disposition", "Authorization"])


    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(routes_bp, url_prefix='/api')
    
    
    @app.route("/")
    def home():
        return {"message": "Welcome to the Project Portal Backend "}

    return app




if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
