import os
from flask import current_app
BASE_DIR = os.path.abspath(os.path.dirname(__file__)) 
UPLOAD_FOLDER = os.path.join(os.path.dirname(BASE_DIR), 'uploads') 
TCIL_FOLDER = os.path.join(UPLOAD_FOLDER, 'tcil_certificates')

# Ensure these exist 
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TCIL_FOLDER, exist_ok=True)
from flask import Blueprint, jsonify, request, send_from_directory,jsonify

from flask_jwt_extended import jwt_required, get_jwt_identity
from models import TCILCertificate, db, Upload, Certificate, User
from decorators import role_required
from werkzeug.utils import secure_filename
from flask_mail import Message
from extensions import mail

from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token


routes_bp = Blueprint('routes', __name__, url_prefix='/api')
def get_upload_path():
    base = os.path.join(os.getcwd(), 'uploads', 'tcil_certificates')
    os.makedirs(base, exist_ok=True)
    return base

@routes_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify(message='Server is up and running! ')




@routes_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    
    if request.method == 'OPTIONS':
        return '', 200
    user = get_jwt_identity()
    return jsonify(
        message="Welcome to your profile!",
        user_id=user['id'],
        role=user['role']
    )


@routes_bp.route('/manager-only', methods=['GET'])
@role_required(['manager', 'admin'])
def only_managers():
    return jsonify(message="Hello, Manager or Admin! ")

@routes_bp.route('/upload', methods=['POST','OPTIONS'])
@jwt_required()
def upload_file():
     
    if request.method == 'OPTIONS':
        return '', 200
    if 'file' not in request.files:
        return jsonify(message='No file part in the request'), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify(message='No selected file'), 400

    filename = secure_filename(file.filename)
    
    # Full path for saving file
    upload_folder = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(upload_folder, exist_ok=True)  # ensure folder exists

    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    # Store metadata in Uploads table
    identity = get_jwt_identity()
    upload = Upload(filename=filename, filepath=filepath, user_id=identity["id"])
    db.session.add(upload)
    db.session.commit()

    return jsonify(
        message='File uploaded successfully!',
        upload_id=upload.id,
        filename=filename
    ), 201




@routes_bp.route('/certificates', methods=['POST'])
@jwt_required()
def upload_certificate():
     
    if request.method == 'OPTIONS':
        return '', 200
    identity = get_jwt_identity()

    # Get form fields
    title = request.form.get('title')
    client = request.form.get('client')
    nature_of_project = request.form.get('nature_of_project')
    sub_nature_of_project = request.form.get('sub_nature_of_project')
    start_date = request.form.get('start_date')
    go_live_date = request.form.get('go_live_date')
    end_date = request.form.get('end_date')
    warranty_years = request.form.get('warranty_years')
    om_years = request.form.get('om_years')
    value = request.form.get('value')
    project_status = request.form.get('project_status')
    tcil_contact_person = request.form.get('tcil_contact_person')
    technologies = request.form.get('technologies')
    concerned_hod = request.form.get('concerned_hod')
    client_contact_name = request.form.get('client_contact_name')
    client_contact_phone = request.form.get('client_contact_phone')
    client_contact_email = request.form.get('client_contact_email')

    # Handle file upload
    if 'file' not in request.files:
        return jsonify(message='File is required'), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(message='Empty filename'), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    upload = Upload(filename=filename, filepath=filepath, user_id=identity["id"])
    db.session.add(upload)
    db.session.flush() 

    # Convert string dates to datetime.date objects if needed
    from datetime import datetime
    def parse_date(date_str):
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None
        except ValueError:
            return None

    # Create certificate record
    cert = Certificate(
        title=title,
        client=client,
        nature_of_project=nature_of_project,
        sub_nature_of_project=sub_nature_of_project,
        start_date=parse_date(start_date),
        go_live_date=parse_date(go_live_date),
        end_date=parse_date(end_date),
        warranty_years=warranty_years,
        om_years=om_years,
        value=value,
        project_status=project_status,
        tcil_contact_person=tcil_contact_person,
        technologies=technologies,
        concerned_hod=concerned_hod,
        client_contact_name=client_contact_name,
        client_contact_phone=client_contact_phone,
        client_contact_email=client_contact_email,
        filename=filename,
        status='pending',
        user_id=identity['id']
    )

    # Save to DB
    db.session.add(cert)
    db.session.commit()
    # Send real-time confirmation email to the employee

    return jsonify(message='Certificate uploaded successfully'), 201

    

@routes_bp.route('/certificates', methods=['GET'])
@jwt_required()
def get_my_certificates():
     
    if request.method == 'OPTIONS':
        return '', 200
    identity = get_jwt_identity()
    my_certs = Certificate.query.filter_by(user_id=identity['id']).all()

    certs_data = []
    for cert in my_certs:
            certs_data.append({
            "id": cert.id,
            "title": cert.title,
            "client": cert.client,
            "status": cert.status,
            "filename": cert.filename,
            "technologies": cert.technologies,
            "start_date": cert.start_date.strftime('%Y-%m-%d') if cert.start_date else None,
            "end_date": cert.end_date.strftime('%Y-%m-%d') if cert.end_date else None,
            "uploaded_on": cert.timestamp.strftime('%Y-%m-%d')
        })

    return jsonify(certificates=certs_data)

@routes_bp.route('/certificates/pending', methods=['GET'])
@jwt_required()
@role_required(['manager', 'admin'])  # Only for managers or admins
def get_pending_certificates():
     
    if request.method == 'OPTIONS':
        return '', 200
    pending_certs = Certificate.query.filter_by(status='pending').all()

    data = []
    for cert in pending_certs:
        data.append({
            "id": cert.id,
            "title": cert.title,
            "client": cert.client,
            "submitted_by": cert.user.name,
            "filename": cert.filename,
            "submitted_on": cert.timestamp.strftime('%Y-%m-%d')
        })

    return jsonify(pending_certificates=data)


@routes_bp.route('/certificates/<int:cert_id>/status', methods=['PATCH'])
@jwt_required()
@role_required(['manager', 'admin'])
def update_certificate_status(cert_id):
    # 1. Find cert
    cert = Certificate.query.get(cert_id)
    if not cert:
        return jsonify(message="Certificate not found"), 404

    # 2. Prevent redundant updates
    if cert.status == 'approved' and request.get_json().get('status') == 'approved':
        return jsonify(message="Already approved."), 400

    # 3. Get JSON body
    data = request.get_json(force=True)
    new_status = data.get('status')

    # 4. Validate
    if new_status not in ['approved', 'rejected']:
        return jsonify(message="Invalid status value."), 400

    # 5. Save change
    cert.status = new_status
    db.session.commit()

    # 6. Return Success immediately
    return jsonify(message=f"Certificate {new_status} successfully"), 200

@routes_bp.route('/certificates/<int:cert_id>', methods=['PATCH'])
@jwt_required()
@role_required(['employee'])
def edit_certificate(cert_id):
     
    if request.method == 'OPTIONS':
        return '', 200
    identity = get_jwt_identity()
    cert = Certificate.query.get(cert_id)

    if not cert:
        return jsonify(message="Certificate not found"), 404
    if cert.user_id != identity['id']:
        return jsonify(message="Unauthorized"), 403
    if cert.status == 'approved':
        return jsonify(message="Approved certificates cannot be edited"), 400

    # Update fields from form-data
    cert.title = request.form.get('title', cert.title)
    cert.client = request.form.get('client', cert.client)
    cert.technologies = request.form.get('technologies', cert.technologies)
    cert.duration = request.form.get('duration', cert.duration)
    cert.project_status = request.form.get('project_status', cert.project_status)
    cert.value = request.form.get('value', cert.value)

    # Optional: update file
    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            filename = secure_filename(file.filename)
            file.save(os.path.join('uploads', filename))
            cert.filename = filename

    # Set status back to pending if it was rejected
    if cert.status == 'rejected':
        cert.status = 'pending'

    db.session.commit()
    return jsonify(message="Certificate updated successfully")

from flask import send_file



@routes_bp.route('/certificates/<int:cert_id>', methods=['GET'])
@jwt_required()
def get_certificate_by_id(cert_id):
     
    if request.method == 'OPTIONS':
        return '', 200
    identity = get_jwt_identity()
    cert = Certificate.query.get(cert_id)

    if not cert:
        return jsonify(message="Certificate not found"), 404

    # Allow if user owns the cert or is a manager/admin
    if cert.user_id != identity['id'] and identity['role'] not in ['manager', 'admin']:
        return jsonify(message="Unauthorized"), 403

    return jsonify({
        "id": cert.id,
        "title": cert.title,
        "client": cert.client,
        "technologies": cert.technologies,
        
        "project_status": cert.project_status,
        "value": cert.value,
        "status": cert.status,
        "filename": cert.filename,
        "created_at": cert.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        "user_id": cert.user_id
    }), 200


@routes_bp.route('/certificates/all', methods=['GET'])
@jwt_required()
@role_required(['manager', 'admin'])
def get_all_certificates_for_manager():
     
    if request.method == 'OPTIONS':
        return '', 200
    certs = Certificate.query.all()

    data = []
    for cert in certs:
            data.append({
            "id": cert.id,
            "title": cert.title,
            "client": cert.client,
            "status": cert.status,
            "filename": cert.filename,
            "technologies": cert.technologies,
            "start_date": cert.start_date.strftime('%Y-%m-%d') if cert.start_date else None,
            "end_date": cert.end_date.strftime('%Y-%m-%d') if cert.end_date else None,
            "uploaded_on": cert.timestamp.strftime('%Y-%m-%d')
        })


    return jsonify(certificates=data)





from datetime import datetime
tcil = Blueprint('tcil', __name__)

UPLOAD_FOLDER = 'uploads/tcil_certificates'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@routes_bp.route('/tcil/upload', methods=['POST'])
@jwt_required()
def upload_tcil_certificate():
    user = get_jwt_identity()
    
    if user['role'] != 'manager':
        return jsonify({'msg': 'Unauthorized: Manager role required'}), 403

    # 1. Capture fields and file
    name = request.form.get('name')
    valid_from_raw = request.form.get('valid_from')
    valid_till_raw = request.form.get('valid_till')
    file = request.files.get('pdf')

    # 2. Validation
    if not all([name, valid_from_raw, valid_till_raw, file]):
        return jsonify({'msg': 'Missing fields. Ensure name, dates, and PDF are provided.'}), 400

    # 3. Date Parsing Logic
    def parse_date(date_str):
        for fmt in ('%Y-%m-%d', '%d-%m-%Y'):
            try:
                return datetime.strptime(date_str, fmt)
            except (ValueError, TypeError):
                continue
        return None

    v_from = parse_date(valid_from_raw)
    v_till = parse_date(valid_till_raw)

    if not v_from or not v_till:
        return jsonify({'msg': f'Invalid date format. Expected YYYY-MM-DD.'}), 400

    try:
        # 4. Save File using the Absolute Path function
        filename = secure_filename(file.filename)
        save_path = get_upload_path()
        full_filepath = os.path.join(save_path, filename)
        file.save(full_filepath)

        # 5. Atomic Database Transaction
        new_upload = Upload(
            filename=filename,
            filepath=full_filepath,
            user_id=user['id']
        )
        db.session.add(new_upload)
        db.session.flush() # Get the upload ID before committing

        cert = TCILCertificate(
            name=name,
            valid_from=v_from,
            valid_till=v_till,
            pdf_path=full_filepath,
            upload_id=new_upload.id 
        )
        db.session.add(cert)
        db.session.commit()

        return jsonify({'msg': 'TCIL Certificate uploaded successfully'}), 201

    except Exception as e:
        db.session.rollback()
        print(f"CRITICAL ERROR: {str(e)}")
        return jsonify({'msg': f'Internal Server Error: {str(e)}'}), 500

@routes_bp.route('/tcil/certificates', methods=['GET'])
@jwt_required()
@role_required(['manager', 'admin'])  # restrict to manager/admin
def get_tcil_certificates():
     
    if request.method == 'OPTIONS':
        return '', 200
    certs = TCILCertificate.query.all()

    data = []
    for cert in certs:
        data.append({
            "id": cert.id,
            "name": cert.name,
            "valid_from": cert.valid_from.strftime('%Y-%m-%d'),
            "valid_till": cert.valid_till.strftime('%Y-%m-%d'),
            "uploaded_on": cert.upload.timestamp.strftime('%Y-%m-%d') if cert.upload else "N/A",
            "filename": cert.upload.filename if cert.upload else "N/A"
        })

    return jsonify(certificates=data)





@routes_bp.route('/certificates/<int:cert_id>', methods=['GET'])
@jwt_required()
def get_certificate(cert_id):
     
    if request.method == 'OPTIONS':
        return '', 200
    identity = get_jwt_identity()
    cert = Certificate.query.get(cert_id)

    if not cert:
        return jsonify(message="Certificate not found"), 404

    if cert.user_id != identity['id'] and identity['role'] != 'manager':
        return jsonify(message="Unauthorized"), 403

    return jsonify({
        "id": cert.id,
        "title": cert.title,
        "client": cert.client,
        "technologies": cert.technologies,
        "project_status": cert.project_status,
        "value": cert.value,
        "status": cert.status,
        "filename": cert.filename,
        "created_at": cert.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        "start_date": cert.start_date.strftime('%Y-%m-%d') if cert.start_date else None,
        "end_date": cert.end_date.strftime('%Y-%m-%d') if cert.end_date else None,
        "go_live_date": cert.go_live_date.strftime('%Y-%m-%d') if cert.go_live_date else None,
        "tcil_contact_person": cert.tcil_contact_person,
        "client_contact_name": cert.client_contact_name,
        "client_contact_email": cert.client_contact_email,
        "user_id": cert.user_id
    }), 200





@routes_bp.route('/certificates/<int:cert_id>/file', methods=['GET'])
@jwt_required()
def preview_certificate(cert_id):
     
    if request.method == 'OPTIONS':
        return '', 200
    identity = get_jwt_identity()
    cert = Certificate.query.get(cert_id)

    if not cert:
        return jsonify({'message': 'Certificate not found'}), 404

    # OPTIONAL: Restrict access
    if cert.user_id != identity['id'] and identity['role'] != 'manager':
        return jsonify({'message': 'Unauthorized'}), 403

    filename = cert.filename
    UPLOAD_FOLDER= os.path.join(os.path.dirname(__file__), 'uploads')

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(file_path):
        print("File not found at:", file_path)
        return jsonify({'message': 'File not found'}), 404

    return send_from_directory(UPLOAD_FOLDER, cert.filename, mimetype='application/pdf')



@routes_bp.route('/certificates/<int:cert_id>/download', methods=['GET'])
@jwt_required()
def download_certificate(cert_id):
     
    if request.method == 'OPTIONS':
        return '', 200
    identity = get_jwt_identity()
    cert = Certificate.query.get(cert_id)

    if not cert:
        return jsonify(message="Certificate not found"), 404

    # Access check: allow only owner or manager/admin
    if cert.user_id != identity['id'] and identity['role'] not in ['manager', 'admin']:
        return jsonify(message="Not authorized to download this certificate"), 403
   
    UPLOAD_FOLDER= os.path.join(os.path.dirname(__file__), 'uploads')

    filepath = os.path.join( UPLOAD_FOLDER, cert.filename)
   
    if not os.path.exists(filepath):
        return jsonify(message="File not found on server"), 404

    return send_file(filepath, as_attachment=True)


from datetime import timedelta
from flask_jwt_extended import create_access_token
@routes_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get('email')
    
    if not email:
        return jsonify(msg="Email is required"), 400

    user = User.query.filter_by(email=email).first()
    
    if user:
        reset_token = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=30))
        # Corrected production link
        reset_link = f"https://tcil-frontend.onrender.com/reset-password/{reset_token}"
        
        msg = Message(
            subject="Password Reset Request",
            sender="ishpreetkgtbit@gmail.com",
            recipients=[user.email],
            body=f"Click the link to reset your password: {reset_link}"
        )
        
        # YOU NEED THIS LINE OR NOTHING HAPPENS:
        try:
            mail.send(msg)
            print(f"INFO: Reset email sent to {user.email}")
        except Exception as e:
            print(f"ERROR: SMTP delivery failed: {str(e)}")
            # Don't return 500 here if you want to maintain the "security" of the 200 response
            
    return jsonify(msg="If this email is registered, a reset link has been sent."), 200
@routes_bp.route('/send-email', methods=['GET','POST'])
def send_email():
    msg = Message(
        subject="Test Email from Flask",
        sender="ishpreetkgtbit@gmail.com",  # match config
        recipients=["ishpreetkaurkamboj7@gmail.com"],  # test email
        body="Hey queen, your Flask app just sent a real email!"
    )
    mail.send(msg)
    return jsonify({"msg": "Email sent successfully!"})





@routes_bp.route('/tcil/certificates/<filename>', methods=['GET'])
@jwt_required()
@role_required(['manager', 'admin'])
def download_tcil_certificate(filename):
    # Use the same pathing function to retrieve
    folder = get_upload_path()
    try:
        return send_from_directory(folder, filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'msg': 'File not found on server'}), 404
    

@routes_bp.route('/auth/reset-password/<token>', methods=['POST'])
def reset_password(token):
    try:
        from flask_jwt_extended import decode_token
        decoded_token = decode_token(token)
        user_id = decoded_token['sub']
    except Exception:
        return jsonify(msg="The reset link is invalid or has expired."), 400

    data = request.get_json()
    new_password = data.get('password')

    if not new_password or len(new_password) < 6:
        return jsonify(msg="Password must be at least 6 characters long."), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify(msg="User not found."), 404

    # Update and save the new password
    user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify(msg="Password has been reset successfully! Redirecting..."), 200