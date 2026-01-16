import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    #database
    _db_url = os.environ.get('DATABASE_URL')
    if _db_url and _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = _db_url or 'sqlite:///project_portal.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- SECURITY ---
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:

        raise ValueError("No JWT_SECRET_KEY set in environment variables!")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # --- MAILING ---
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')

    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')