import os
from app import create_app
from extensions import db
from models import User
from dotenv import load_dotenv

load_dotenv()

app = create_app()

def seed_data():
    with app.app_context():
        db.create_all()
        
        admin_email = os.getenv("ADMIN_EMAIL", "admin@tcil.com")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if not admin_password:
            print("❌ ERROR: ADMIN_PASSWORD not found in .env. Seed failed.")
            return

        admin = User.query.filter_by(role='admin').first()
        if not admin:
            print(f"Creating Master Admin: {admin_email}...")
            master_admin = User(
                name="System Admin",
                email=admin_email,
                role="admin"
            )
            master_admin.set_password(admin_password)
            db.session.add(master_admin)
            db.session.commit()
            print("✅ Master Admin created successfully.")
        else:
            print("ℹ️ Admin already exists...")

if __name__ == "__main__":
    seed_data()