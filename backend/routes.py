import os
import uuid
import threading
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, get_jwt, decode_token
from werkzeug.utils import secure_filename
from supabase import create_client

from extensions import db, mail
from flask_mail import Message
from models import TCILCertificate, db, Upload, Certificate, User
from decorators import role_required

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

routes_bp = Blueprint('routes', __name__, url_prefix='/api')

# --- HELPERS ---

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_date(date_str):
    if not date_str: return None
    for fmt in ('%Y-%m-%d', '%d-%m-%Y'):
        try: return datetime.strptime(date_str, fmt).date()
        except: continue
    return None

def upload_to_supabase(file, bucket="certificates"):
    """Uploads binary to Supabase and returns the permanent Public URL"""
    ext = os.path.splitext(file.filename)[1]
    # Unique name prevents overwriting files with the same name
    unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
    
    # Reset file pointer and read
    file.seek(0)
    file_binary = file.read()
    
    # Upload to Supabase Storage
    
    res = supabase.storage.from_(bucket).upload(
        path=unique_name,
        file=file_binary,
        file_options={"content-type": "application/pdf"}
    )
    
    # Return the direct public URL
    return supabase.storage.from_(bucket).get_public_url(unique_name)

# --- CORE LOGIC ---

@routes_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_unified_stats():
    user_id = get_jwt_identity()
    role = get_jwt().get('role')

    if role == 'admin':
        certs_q = Certificate.query
        total_users = User.query.count()
    elif role == 'manager':
        team_ids = [u.id for u in User.query.filter_by(manager_id=user_id).all()]
        team_ids.append(int(user_id)) 
        certs_q = Certificate.query.filter(Certificate.user_id.in_(team_ids))
        total_users = len(team_ids)
    else:
        certs_q = Certificate.query.filter_by(user_id=user_id)
        total_users = 1 

    return jsonify({
        "total_uploads": certs_q.count(),
        "pending_approvals": certs_q.filter_by(status='pending').count(),
        "approved": certs_q.filter_by(status='approved').count(),
        "team_size": total_users
    }), 200

@routes_bp.route('/certificates/all', methods=['GET'])
@jwt_required()
def get_all_certificates():
    user_id = get_jwt_identity()
    role = get_jwt().get('role', 'employee')
    
    if role == 'admin':
        certs = Certificate.query.all()
    elif role == 'manager':
        team_ids = [u.id for u in User.query.filter_by(manager_id=user_id).all()]
        team_ids.append(user_id)
        certs = Certificate.query.filter(Certificate.user_id.in_(team_ids)).all()
    else:
        certs = Certificate.query.filter_by(user_id=user_id).all()

    return jsonify([{
        "id": c.id,
        "title": c.title,
        "client": c.client,
        "status": c.status,
        "filename": c.filename, # This is now the URL
        "timestamp": c.timestamp.isoformat() if c.timestamp else None,
        "user_id": c.user_id
    } for c in certs]), 200

@routes_bp.route('/certificates', methods=['POST'])
@jwt_required()
def upload_certificate():
   user_id = get_jwt_identity()
   file = request.files.get('file')
    
   if not file or not allowed_file(file.filename):
        return jsonify(message='Valid PDF required'), 400
   try:
        cloud_url = upload_to_supabase(file)

        up = Upload(filename=file.filename, filepath=cloud_url, user_id=user_id)
        db.session.add(up)
        db.session.flush()

        cert = Certificate(
            title=request.form.get('title'),
            client=request.form.get('client'),
            nature_of_project=request.form.get('nature_of_project'),
            sub_nature_of_project=request.form.get('sub_nature_of_project'),
            start_date=parse_date(request.form.get('start_date')),
            go_live_date=parse_date(request.form.get('go_live_date')),
            end_date=parse_date(request.form.get('end_date')),
            value=request.form.get('value'),
            status='pending',
            filename=cloud_url, 
            user_id=user_id,
            upload_id=up.id,
            timestamp=datetime.utcnow()
        )
        db.session.add(cert)
        db.session.commit()
        return jsonify(message='Published to Cloud Storage', url=cloud_url), 201
   except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Cloud Upload Failed: {str(e)}"), 500
    
@routes_bp.route('/certificates/<int:cert_id>/status', methods=['PATCH'])
@jwt_required()
@role_required(['manager', 'admin'])
def update_status(cert_id):
    user_id = get_jwt_identity() 
    user_role = get_jwt().get('role')
    cert = Certificate.query.get_or_404(cert_id)

    if user_role == 'manager':
        sub_employee = User.query.get(cert.user_id)
        if not sub_employee or str(sub_employee.manager_id) != str(user_id):
            return jsonify(message="Unauthorized"), 403

    status = request.get_json().get('status')
    if status in ['approved', 'rejected']:
        cert.status = status
        db.session.commit()
        return jsonify(message=f"Status: {status}")
    return jsonify(message="Invalid status"), 400

@routes_bp.route('/tcil/upload', methods=['POST'])
@jwt_required()
def upload_tcil_official():
    user_id = get_jwt_identity()
    file = request.files.get('pdf')
    if not file or not file.filename.endswith('.pdf'):
        return jsonify(message='Only PDF allowed'), 400

    try:
        cloud_url = upload_to_supabase(file)
        up = Upload(filename=file.filename, filepath=cloud_url, user_id=user_id)
        db.session.add(up)
        db.session.flush() 

        new_tcil = TCILCertificate(
            name=request.form.get('name'),
            valid_from=parse_date(request.form.get('valid_from')),
            valid_till=parse_date(request.form.get('valid_till')),
            pdf_path=cloud_url, 
            upload_id=up.id
        )
        db.session.add(new_tcil)
        db.session.commit()
        return jsonify(msg="Published to Supabase"), 201
    except Exception as e:
        db.session.rollback()
        return jsonify(message=str(e)), 500

@routes_bp.route('/tcil/certificates', methods=['GET'])
@jwt_required()
def get_all_tcil():
    certs = TCILCertificate.query.all()
    return jsonify({
        "certificates": [{
            "id": c.id,
            "name": c.name,
            "valid_from": c.valid_from.isoformat() if c.valid_from else None,
            "valid_till": c.valid_till.isoformat() if c.valid_till else None,
            "filename": c.pdf_path, # This is the full Supabase URL
            "uploaded_by": c.upload.user.name if c.upload else "System",
            "uploader_id": c.upload.user_id if c.upload else None
        } for c in certs]
    }), 200

@routes_bp.route('/tcil/certificates/<int:cert_id>', methods=['DELETE'])
@jwt_required()
def delete_tcil_cert(cert_id):
    cert = TCILCertificate.query.get_or_404(cert_id)
    user_id = str(get_jwt_identity())
    is_admin = get_jwt().get('role') == 'admin'

    if str(cert.upload.user_id) != user_id and not is_admin:
        return jsonify(message="Unauthorized"), 403
        
    try:
        # 1. Extract filename from the URL to delete from Supabase
        # URL format: .../bucket/unique_name
        cloud_filename = cert.pdf_path.split('/')[-1]
        supabase.storage.from_("certificates").remove([cloud_filename])

        # 2. Delete from DB (The Upload record will be handled by your Cascade or manual delete)
        db.session.delete(cert)
        db.session.commit()
        return jsonify(msg="Removed from Cloud and DB"), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message=str(e)), 500

# --- AUTH / EMAIL ---

def send_async_email(app, message_data):
    with app.app_context():
        try:
            msg = Message(
                subject=message_data['subject'],
                recipients=[message_data['to']],
                html=message_data.get('html') 
            )
            mail.send(msg)
        except Exception as e:
            print(f"Email Error: {e}")

@routes_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    email = request.get_json().get('email')
    user = User.query.filter_by(email=email).first()
    if user:
        token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=1), additional_claims={"type": "password_reset"})
        link = f"https://tcil-frontend.onrender.com/reset-password/{token}"
        msg_data = {"to": user.email, "subject": "Reset Password", "html": f"<p>Click <a href='{link}'>here</a></p>"}
        app = current_app._get_current_object()
        threading.Thread(target=send_async_email, args=(app, msg_data)).start()
    return jsonify(message="Reset email sent if account exists"), 200

@routes_bp.route('/auth/reset-password/<token>', methods=['POST'])
def reset_password(token):
    try:
        decoded = decode_token(token)
        user = db.session.get(User, decoded['sub'])
        user.set_password(request.get_json().get('password'))
        db.session.commit()
        return jsonify(msg="Password updated"), 200
    except:
        return jsonify(msg="Invalid/Expired link"), 400

@routes_bp.route('/auth/managers', methods=['GET'])
def get_managers():
    managers = User.query.filter(User.role.in_(['manager', 'admin'])).all()
    return jsonify([{"id": m.id, "name": m.name, "role": m.role} for m in managers]), 200