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
    user_role = claims.get('role')
    
    cert = Certificate.query.get_or_404(cert_id)
    

    if user_role == 'manager':
        sub_employee = User.query.get(cert.user_id)
        if not sub_employee or str(sub_employee.manager_id) != str(user_id):
            return jsonify(message="Unauthorized for this team member"), 403

    status = request.get_json().get('status')
    if status in ['approved', 'rejected']:
        cert.status = status
        db.session.commit()
        return jsonify(message=f"Status: {status}")
        
    return jsonify(message="Invalid status"), 400

@routes_bp.route('/certificates/<int:cert_id>', methods=['PUT'])
@jwt_required()
def edit_certificate(cert_id):
    user_id = get_jwt_identity()
    cert = Certificate.query.get_or_404(cert_id)

    # 1. Permission Check
    if str(cert.user_id) != str(user_id):
        return jsonify(message="Unauthorized"), 403
    
    # 2.  Lock if already approved
    if cert.status == 'approved':
        return jsonify(message="Approved certificates cannot be edited"), 400

    data = request.form

    cert.title = data.get('title', cert.title)
    cert.client = data.get('client', cert.client)
    cert.nature_of_project = data.get('nature_of_project', cert.nature_of_project)
    cert.sub_nature_of_project = data.get('sub_nature_of_project', cert.sub_nature_of_project)
    cert.value = data.get('value', cert.value)
    cert.warranty_years = data.get('warranty_years', cert.warranty_years)
    cert.om_years = data.get('om_years', cert.om_years)
    cert.project_status = data.get('project_status', cert.project_status)
    cert.tcil_contact_person = data.get('tcil_contact_person', cert.tcil_contact_person)
    cert.technologies = data.get('technologies', cert.technologies)
    cert.concerned_hod = data.get('concerned_hod', cert.concerned_hod)
    cert.client_contact_name = data.get('client_contact_name', cert.client_contact_name)
    cert.client_contact_phone = data.get('client_contact_phone', cert.client_contact_phone)
    cert.client_contact_email = data.get('client_contact_email', cert.client_contact_email)

    # Update Date Fields using our parse_date helper
    cert.start_date = parse_date(data.get('start_date')) or cert.start_date
    cert.go_live_date = parse_date(data.get('go_live_date')) or cert.go_live_date
    cert.end_date = parse_date(data.get('end_date')) or cert.end_date

    # Handle File Re-upload
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename):
            unique_name = f"{uuid.uuid4().hex[:8]}_{secure_filename(file.filename)}"
            file.save(os.path.join(UPLOAD_FOLDER, unique_name))
            cert.filename = unique_name

    #  Reset status for re-approval
    cert.status = 'pending' 
    db.session.commit()
    
    return jsonify(message="Certificate updated and resubmitted for approval"), 200

@routes_bp.route('/auth/managers', methods=['GET'])
def get_managers():
    managers = User.query.filter(User.role.in_(['manager', 'admin'])).all()
    return jsonify([{"id": m.id, "name": m.name, "role": m.role} for m in managers]), 200

def send_async_email(app, message_data):
    with app.app_context():
        # Force the email to a string to ensure it's not None
        sender = app.config.get('MAIL_DEFAULT_SENDER')
        
        if not sender:
            print("CRITICAL ERROR: MAIL_DEFAULT_SENDER is not set in environment.")
            return

        message = Mail(
            from_email=sender,
            to_emails=message_data['to'],
            subject=message_data['subject'],
            html_content=message_data['html'] # Change from plain_text to html_content [cite: 2026-01-07]
)
       
        try:
            sg = SendGridAPIClient(app.config.get('SENDGRID_API_KEY'))
            response = sg.send(message)
            print(f"MAIL SENT: Status Code {response.status_code}")
        except Exception as e:
            print(f"SENDGRID DETAIL: {e.body if hasattr(e, 'body') else str(e)}")

@routes_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    email = request.get_json().get('email')
    user = User.query.filter_by(email=email).first()
    
    if user:
        token = create_access_token(
            identity=str(user.id), 
            expires_delta=timedelta(hours=1),
            additional_claims={"type": "password_reset"}
        )
        
        link = f"https://tcil-frontend.onrender.com/reset-password/{token}"
        msg_data = {
            "to": user.email,
            "subject": "Reset Your CertFlow Password",
            "html": f"""
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px;">
                    <h2 style="color: #007bff;">CertFlow</h2>
                    <h3>Password Reset Request</h3>
                    <p>We received a request to reset your password. Click the button below to proceed:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{link}" style="background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #666; font-size: 12px;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 11px;">Trouble with the button? Copy and paste this: {link}</p>
                </div>
            """
        }
        
        # Call the email function ONLY if the user exists
        send_async_email(current_app._get_current_object(), msg_data)
        
    # Always return 200 to prevent "Email Harvesting" (Security best practice)
    return jsonify(message="If account exists, reset instructions were sent."), 200

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

@routes_bp.route('/tcil/upload', methods=['POST'])
@jwt_required()
def upload_tcil_official():
    user_id = get_jwt_identity()
    
    file = request.files.get('pdf')
    if not file or not file.filename.endswith('.pdf'):
        return jsonify(message='Only PDF files are allowed'), 400

    unique_name = f"TCIL_{uuid.uuid4().hex[:6]}_{secure_filename(file.filename)}"
    path = os.path.join(TCIL_FOLDER, unique_name)
    file.save(path)

    try:
       
        up = Upload(filename=unique_name, filepath=path, user_id=user_id)
        db.session.add(up)
        db.session.flush() 

        
        new_tcil = TCILCertificate(
            name=request.form.get('name'),
            valid_from=parse_date(request.form.get('valid_from')),
            valid_till=parse_date(request.form.get('valid_till')),
            pdf_path=unique_name, 
            upload_id=up.id
        )
        db.session.add(new_tcil)
        db.session.commit()
        return jsonify(msg="TCIL Certificate published to repository"), 201
    except Exception as e:
        db.session.rollback()
        if os.path.exists(path): os.remove(path)
        return jsonify(message=str(e)), 500


# to get all TCIL certs for the table 
@routes_bp.route('/tcil/certificates', methods=['GET'])
@jwt_required()
def get_all_tcil():
    # Accessible by everyone 
    certs = TCILCertificate.query.all()
    return jsonify({
        "certificates": [{
            "id": c.id,
            "name": c.name,
            "valid_from": c.valid_from.isoformat() if c.valid_from else None,
            "valid_till": c.valid_till.isoformat() if c.valid_till else None,
            "filename": c.pdf_path, # uses pdf_path
            "uploaded_on": c.upload.timestamp.isoformat() if c.upload else None
        } for c in certs]
    }), 200

@routes_bp.route('/tcil/certificates/<string:filename>', methods=['GET'])
@jwt_required()
def download_tcil_file(filename):
    return send_from_directory(TCIL_FOLDER, filename, as_attachment=True)
