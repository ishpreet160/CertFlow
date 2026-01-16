import os, uuid, threading
from extensions import db
from flask import Blueprint, jsonify, request, send_from_directory, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from models import TCILCertificate, db, Upload, Certificate, User
from decorators import role_required
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# --- CONFIG & DIRECTORIES ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__)) 
UPLOAD_FOLDER = os.path.join(os.path.dirname(BASE_DIR), 'uploads') 
TCIL_FOLDER = os.path.join(UPLOAD_FOLDER, 'tcil_certificates')
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

for folder in [UPLOAD_FOLDER, TCIL_FOLDER]:
    os.makedirs(folder, exist_ok=True)

routes_bp = Blueprint('routes', __name__, url_prefix='/api')

# --- UTILITY HELPERS (The "Don't Repeat Yourself" Section) ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_date(date_str):
    if not date_str: return None
    for fmt in ('%Y-%m-%d', '%d-%m-%Y'):
        try: return datetime.strptime(date_str, fmt).date()
        except: continue
    return None

def send_async_email(app, message_data):
    with app.app_context():
        message = Mail(
            from_email=app.config.get('MAIL_DEFAULT_SENDER'),
            to_emails=message_data['to'],
            subject=message_data['subject'],
            plain_text_content=message_data['body']
        )
        try:
            sg = SendGridAPIClient(app.config.get('SENDGRID_API_KEY'))
            sg.send(message)
        except Exception as e:
            print(f"MAIL ERROR: {str(e)}")

# --- SYSTEM & DASHBOARD ---
@routes_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify(message='Server is up and running!')

@routes_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
@role_required(['manager', 'admin'])
def get_stats():
    identity = get_jwt_identity()
    if identity['role'] == 'admin':
        users_q = User.query.filter(User.role != 'admin')
        certs_q = Certificate.query
    else:
        sub_ids = [u.id for u in User.query.filter_by(manager_id=identity['id']).all()]
        users_q = User.query.filter(User.id.in_(sub_ids))
        certs_q = Certificate.query.filter(Certificate.user_id.in_(sub_ids))

    return jsonify({
        "total_team_members": users_q.count(),
        "total_uploads": certs_q.count(),
        "pending_approvals": certs_q.filter_by(status='pending').count()
    })

# --- CERTIFICATE MANAGEMENT ---
@routes_bp.route('/certificates', methods=['POST'])
@jwt_required()
def upload_certificate():
    identity = get_jwt_identity()
    if identity['role'] == 'admin': return jsonify(message="Admins cannot upload"), 403

    file = request.files.get('file')
    if not file or not allowed_file(file.filename):
        return jsonify(message='Valid file is required'), 400

    unique_name = f"{uuid.uuid4().hex[:8]}_{secure_filename(file.filename)}"
    path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(path)

    try:
        up = Upload(filename=unique_name, filepath=path, user_id=identity['id'])
        db.session.add(up); db.session.flush()

        cert = Certificate(
            title=request.form.get('title'),
            client=request.form.get('client'),
            nature_of_project=request.form.get('nature_of_project'),
            technologies=request.form.get('technologies'),
            start_date=parse_date(request.form.get('start_date')),
            end_date=parse_date(request.form.get('end_date')),
            status='pending',
            filename=unique_name,
            user_id=identity['id'],
            upload_id=up.id
        )
        db.session.add(cert); db.session.commit()
        return jsonify(message='Uploaded', cert_id=cert.id), 201
    except Exception as e:
        db.session.rollback()
        if os.path.exists(path): os.remove(path)
        return jsonify(message=str(e)), 500

@routes_bp.route('/certificates/<int:cert_id>', methods=['GET', 'PATCH', 'DELETE'])
@jwt_required()
def handle_certificate(cert_id):
    identity = get_jwt_identity()
    cert = Certificate.query.get_or_404(cert_id)
    is_owner = cert.user_id == identity['id']
    is_manager = identity['role'] in ['manager', 'admin']

    # GET logic
    if request.method == 'GET':
        if not is_owner and not is_manager: return jsonify(message="Forbidden"), 403
        return jsonify(id=cert.id, title=cert.title, status=cert.status, filename=cert.filename)

    # DELETE logic
    if request.method == 'DELETE':
        if not is_owner and identity['role'] != 'admin': return jsonify(message="Forbidden"), 403
        if cert.status == 'approved': return jsonify(message="Cannot delete approved"), 400
        path = os.path.join(UPLOAD_FOLDER, cert.filename)
        db.session.delete(cert); db.session.commit()
        if os.path.exists(path): os.remove(path)
        return jsonify(message="Deleted")

    # PATCH (Edit) logic
    if request.method == 'PATCH':
        if not is_owner: return jsonify(message="Forbidden"), 403
        if cert.status == 'approved': return jsonify(message="Locked"), 400
        cert.title = request.form.get('title', cert.title)
        if cert.status == 'rejected': cert.status = 'pending'
        db.session.commit()
        return jsonify(message="Updated")

@routes_bp.route('/certificates/<int:cert_id>/status', methods=['PATCH'])
@jwt_required()
@role_required(['manager', 'admin'])
def update_status(cert_id):
    identity = get_jwt_identity()
    cert = Certificate.query.get_or_404(cert_id)
    
    # Check if manager owns this employee
    if identity['role'] == 'manager':
        sub = User.query.get(cert.user_id)
        if not sub or sub.manager_id != identity['id']:
            return jsonify(message="Unauthorized for this team"), 403

    status = request.get_json().get('status')
    if status in ['approved', 'rejected']:
        cert.status = status
        db.session.commit()
        return jsonify(message=f"Status: {status}")
    return jsonify(message="Invalid status"), 400

# --- TCIL LOGIC ---
@routes_bp.route('/tcil/upload', methods=['POST'])
@jwt_required()
@role_required(['manager'])
def upload_tcil():
    file = request.files.get('pdf')
    if not file: return jsonify(msg="File required"), 400
    unique_name = f"tcil_{uuid.uuid4().hex[:6]}.pdf"
    path = os.path.join(TCIL_FOLDER, unique_name)
    file.save(path)
    
    try:
        up = Upload(filename=unique_name, filepath=path, user_id=get_jwt_identity()['id'])
        db.session.add(up); db.session.flush()
        tcil = TCILCertificate(name=request.form.get('name'), pdf_path=unique_name, upload_id=up.id)
        db.session.add(tcil); db.session.commit()
        return jsonify(msg="TCIL Saved"), 201
    except Exception as e:
        db.session.rollback(); return jsonify(msg=str(e)), 500

# --- AUTH & EMAILS ---
@routes_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    email = request.get_json().get('email')
    user = User.query.filter_by(email=email).first()
    if user:
        token = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=30), additional_claims={"type": "password_reset"})
        link = f"https://tcil-frontend.onrender.com/reset-password/{token}"
        threading.Thread(target=send_async_email, args=(current_app._get_current_object(), {"to": user.email, "subject": "Reset Password", "body": f"Link: {link}"})).start()
    return jsonify(msg="If email exists, link sent.")

@routes_bp.route('/auth/reset-password/<token>', methods=['POST'])
def reset_password(token):
    from flask_jwt_extended import decode_token
    try:
        decoded = decode_token(token)
        if decoded.get('type') != 'password_reset': return jsonify(msg="Invalid"), 401
        user = db.session.get(User, decoded['sub'])
        user.set_password(request.get_json().get('password'))
        db.session.commit()
        return jsonify(msg="Success")
    except: return jsonify(msg="Expired/Invalid"), 400


@routes_bp.route('/certificates/all', methods=['GET'])
@jwt_required()
def get_all_certificates():
    identity = get_jwt_identity()
    user_id = identity['id']
    role = identity['role']

    # 1. ADMIN sees everything
    if role == 'admin':
        certs = Certificate.query.all()
    
    # 2. MANAGER sees their own + their team's certs
    elif role == 'manager':
        # Get IDs of all employees reporting to this manager
        team_member_ids = [u.id for u in User.query.filter_by(manager_id=user_id).all()]
        team_member_ids.append(user_id) # Include manager's own certs
        certs = Certificate.query.filter(Certificate.user_id.in_(team_member_ids)).all()
    
    # 3. EMPLOYEE sees only their own
    else:
        certs = Certificate.query.filter_by(user_id=user_id).all()

    # Manual serialization since we need to return a list
    result = []
    for c in certs:
        result.append({
            "id": c.id,
            "title": c.title,
            "client": c.client,
            "status": c.status,
            "filename": c.filename,
            "timestamp": c.timestamp.isoformat() if hasattr(c, 'timestamp') and c.timestamp else None,
            "user_id": c.user_id
        })
    
    return jsonify(result), 200