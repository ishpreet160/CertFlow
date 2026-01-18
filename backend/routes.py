import os, uuid, threading
from extensions import db
from flask import Blueprint, jsonify, request, send_from_directory, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, get_jwt
from models import TCILCertificate, db, Upload, Certificate, User
from decorators import role_required
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


BASE_DIR = os.path.abspath(os.path.dirname(__file__)) 
UPLOAD_FOLDER = os.path.join(os.path.dirname(BASE_DIR), 'uploads') 
TCIL_FOLDER = os.path.join(UPLOAD_FOLDER, 'tcil_certificates')
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

for folder in [UPLOAD_FOLDER, TCIL_FOLDER]:
    os.makedirs(folder, exist_ok=True)

routes_bp = Blueprint('routes', __name__, url_prefix='/api')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_date(date_str):
    if not date_str: return None
    for fmt in ('%Y-%m-%d', '%d-%m-%Y'):
        try: return datetime.strptime(date_str, fmt).date()
        except: continue
    return None


@routes_bp.route('/certificates/<int:cert_id>/file', methods=['GET'])
@jwt_required()
def preview_certificate(cert_id):

    cert = Certificate.query.get_or_404(cert_id)
    identity = get_jwt_identity()
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    is_owner = str(cert.user_id) == str(user_id)
    is_privileged = role in ['manager', 'admin']

    if not is_owner and not is_privileged:
        return jsonify(message="Forbidden"), 403

    return send_from_directory(UPLOAD_FOLDER, cert.filename)

@routes_bp.route('/certificates/<int:cert_id>/download', methods=['GET'])
@jwt_required()
def download_certificate(cert_id):
    """Triggers a browser download."""
    cert = Certificate.query.get_or_404(cert_id)
    return send_file(os.path.join(UPLOAD_FOLDER, cert.filename), as_attachment=True)


@routes_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
@role_required(['manager', 'admin'])
def get_stats():
    identity = get_jwt_identity()
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    if role == 'admin':
        users_q = User.query.filter(User.role != 'admin')
        certs_q = Certificate.query
    else:
        sub_ids = [u.id for u in User.query.filter_by(manager_id=user_id).all()]
        users_q = User.query.filter(User.id.in_(sub_ids))
        certs_q = Certificate.query.filter(Certificate.user_id.in_(sub_ids))

    return jsonify({
        "total_team_members": users_q.count(),
        "total_uploads": certs_q.count(),
        "pending_approvals": certs_q.filter_by(status='pending').count()
    })

# --- CERTIFICATE MANAGEMENT ---

@routes_bp.route('/certificates/all', methods=['GET'])
@jwt_required()
def get_all_certificates():
    
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'employee')
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
        "filename": c.filename,
        "timestamp": c.timestamp.isoformat() if hasattr(c, 'timestamp') and c.timestamp else None,
        "user_id": c.user_id
    } for c in certs]), 200

@routes_bp.route('/certificates', methods=['POST'])
@jwt_required()
def upload_certificate():
    claims = get_jwt()
    user_id = get_jwt_identity()
    if claims.get('role') == 'admin':
        return jsonify(message="Admins cannot upload"), 403

    file = request.files.get('file')
    if not file or not allowed_file(file.filename):
        return jsonify(message='Valid file is required'), 400

    unique_name = f"{uuid.uuid4().hex[:8]}_{secure_filename(file.filename)}"
    path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(path)

    try:
        up = Upload(filename=unique_name, filepath=path, user_id=user_id)
        db.session.add(up); db.session.flush()

        cert = Certificate(
            title=request.form.get('title'),
            client=request.form.get('client'),
            nature_of_project=request.form.get('nature_of_project'),
            sub_nature_of_project=request.form.get('sub_nature_of_project'),
            start_date=parse_date(request.form.get('start_date')),
            go_live_date=parse_date(request.form.get('go_live_date')),
            end_date=parse_date(request.form.get('end_date')),
            warranty_years=request.form.get('warranty_years'),
            om_years=request.form.get('om_years'),
            value=request.form.get('value'),
            project_status=request.form.get('project_status'),
            tcil_contact_person=request.form.get('tcil_contact_person'),
            technologies=request.form.get('technologies'),
            concerned_hod=request.form.get('concerned_hod'),
            client_contact_name=request.form.get('client_contact_name'),
            client_contact_phone=request.form.get('client_contact_phone'),
            client_contact_email=request.form.get('client_contact_email'),
            status='pending',
            filename=unique_name,
            user_id=user_id,
            upload_id=up.id,
            timestamp=datetime.utcnow()
        )
        db.session.add(cert); db.session.commit()
        return jsonify(message='Uploaded', cert_id=cert.id), 201
    except Exception as e:
        db.session.rollback()
        if os.path.exists(path): os.remove(path)
        return jsonify(message=str(e)), 500

@routes_bp.route('/certificates/<int:cert_id>/status', methods=['PATCH'])
@jwt_required()
@role_required(['manager', 'admin'])
def update_status(cert_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    cert = Certificate.query.get_or_404(cert_id)
    if claims.get('role') == 'manager':
        sub = User.query.get(cert.user_id)
        if not sub or str(sub.manager_id) != str(user_id):
            return jsonify(message="Unauthorized for this team"), 403

    status = request.get_json().get('status')
    if status in ['approved', 'rejected']:
        cert.status = status
        db.session.commit()
        return jsonify(message=f"Status: {status}")
    return jsonify(message="Invalid status"), 400

@routes_bp.route('/auth/managers', methods=['GET'])
def get_managers():
    managers = User.query.filter(User.role.in_(['manager', 'admin'])).all()
    return jsonify([{"id": m.id, "name": m.name, "role": m.role} for m in managers]), 200

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
