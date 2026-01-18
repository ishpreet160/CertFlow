import os
from flask import Flask
from dotenv import load_dotenv
from flask_cors import CORS
from extensions import db, jwt 

load_dotenv()

def create_app():
    app = Flask(__name__)
    

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "super-secret-key")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_DEFAULT_SENDER")
    app.config['SENDGRID_API_KEY'] = os.getenv("SENDGRID_API_KEY")

    print("--- Environment Check ---")
    print(f"DEBUG: MAIL_DEFAULT_SENDER -> {app.config['MAIL_DEFAULT_SENDER']}")
    if not app.config['SENDGRID_API_KEY']:
        print("WARNING: SENDGRID_API_KEY is missing from environment!")
    print("-------------------------")

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)


    @jwt.user_identity_loader
    def user_identity_lookup(user_identity):

        if isinstance(user_identity, dict):
            return str(user_identity.get("id"))
        return str(user_identity)

    @jwt.additional_claims_loader
    def add_claims_to_access_token(user_identity):
        if isinstance(user_identity, dict):
            return {"role": user_identity.get("role")}
        return {}

  
    with app.app_context():

        from routes import routes_bp
        from auth import auth_bp
        
        app.register_blueprint(routes_bp)
        app.register_blueprint(auth_bp)
        

        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()

    app.run(debug=True, host="0.0.0.0", port=5000)