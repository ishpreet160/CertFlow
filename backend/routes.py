import os
from flask import current_app
BASE_DIR = os.path.abspath(os.path.dirname(__file__)) 
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
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

from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token

routes_bp = Blueprint('routes', __name__, url_prefix='/api')

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
    user = User.query.get(identity['id'])

    if user and user.email:
     msg = Message(
        subject="Certificate Submission Successful",
        recipients=[user.email],
        body=f"Hello {user.name},\n\n"
             f"Your certificate '{title}' has been successfully submitted for review.\n"
             f"We'll notify you once it's approved or rejected.\n\n"
             "Thank you,\nProject Experience Portal"
     )
    mail.send(msg)
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
     
    if request.method == 'OPTIONS':
        return '', 200
    # ✅ 1. Find cert
    cert = Certificate.query.get(cert_id)
    if not cert:
        return jsonify(message="Certificate not found"), 404

    # ✅ 2. Already approved? Disallow change
    if cert.status == 'approved':
        return jsonify(message="Already approved. Cannot modify."), 400

    # ✅ 3. Get JSON body
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify(message="Invalid JSON body"), 400

    if not data or 'status' not in data:
        return jsonify(message="Missing 'status' in request body"), 400

    new_status = data.get('status')

    # ✅ 4. Validate status value
    if new_status not in ['approved', 'rejected']:
        return jsonify(message="Invalid status value. Must be 'approved' or 'rejected'."), 400

    # ✅ 5. Assign new status
    cert.status = new_status
    db.session.commit()

    # ✅ 6. Email notification
    try:
        employee = User.query.get(cert.user_id)
        if employee and employee.email:
            msg = Message(
                subject=f"Your Certificate was {new_status.capitalize()}",
                recipients=[employee.email],
                body=f"Hello {employee.name},\n\nYour certificate '{cert.title}' was {new_status}."
            )
            mail.send(msg)
    except Exception as e:
        print(f"MAIL ERROR: Email failed to send, but status was updated. Error: {e}")

    return jsonify(message=f"Certificate {new_status} successfully")




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
    if request.method == 'OPTIONS':
        return '', 200  # For CORS preflight

    #  Step 1: Get user & check role
    user = get_jwt_identity()
    if user['role'] != 'manager':
        return jsonify({'msg': 'Unauthorized'}), 403

    #  Step 2: Get form data
    name = request.form.get('name')
    valid_from = request.form.get('valid_from')
    valid_till = request.form.get('valid_till')
    file = request.files.get('pdf')

    #  Step 3: Validate fields
    if not all([name, valid_from, valid_till, file]):
        return jsonify({'msg': 'All fields required'}), 400
    if file.filename == '':
        return jsonify({'msg': 'Invalid file'}), 400

    #  Step 4: Save the PDF file
    filename = secure_filename(file.filename)
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    #  Step 5: Save to Uploads table
    upload = Upload(
        filename=filename,
        filepath=path,
        user_id=user['id']
    )
    db.session.add(upload)
    db.session.flush()  # Get upload.id without committing yet

    # Step 6: Save to TCILCertificate table
    cert = TCILCertificate(
        name=name,
        valid_from=datetime.strptime(valid_from, '%Y-%m-%d'),
        valid_till=datetime.strptime(valid_till, '%Y-%m-%d'),
        pdf_path=path,
        upload_id=upload.id  #  Linking 
    )
    db.session.add(cert)
    db.session.commit()

    return jsonify({'msg': 'TCIL Certificate uploaded successfully'}), 201





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



@routes_bp.route('/auth/reset-password/<token>', methods=['POST'])
def reset_password(token):
    from flask_jwt_extended import decode_token
    from werkzeug.security import generate_password_hash

    try:
        decoded = decode_token(token)
        user_id = decoded['sub']['id']
        user = User.query.get(user_id)

        if not user:
            return jsonify({"msg": "User not found"}), 404

        data = request.get_json()
        new_password = data.get('password')

        if not new_password:
            return jsonify({"msg": "Password required"}), 400

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()

        return jsonify({"msg": "Password reset successful"}), 200

    except Exception as e:
        return jsonify({"msg": f"Error: {str(e)}"}), 400



from datetime import timedelta
from flask_jwt_extended import create_access_token

@routes_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify(msg="Email is required"), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify(msg="No user found with this email"), 404

    # Create a JWT token valid for 15 minutes
    reset_token = create_access_token(
        identity={'id': user.id, 'role': user.role},
        expires_delta=timedelta(minutes=15)
    )

    # removed localhost here. Using Render Frontend URL.
    frontend_url = "https://tcil-frontend.onrender.com" 
    reset_url = f"{frontend_url}/reset-password/{reset_token}"

    msg = Message(
        subject="Password Reset Request",
        recipients=[user.email],
        html=f"""
        <p>Hello {user.name},</p>
        <p>You requested a password reset. Click below to set a new password:</p>
        <p><a href="{reset_url}">Reset Password</a></p>
        <p>This link expires in 15 minutes.</p>
        <br>
        <p>– Project Experience Portal</p>
        """
    )
    mail.send(msg)

    return jsonify(msg="Password reset link sent to your email."), 200






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
@role_required(['manager', 'admin'])  # Optional: Restrict to manager/admin
def download_tcil_certificate(filename):
    folder = os.path.join(os.path.dirname(__file__), 'uploads', 'tcil_certificates')
    try:
        return send_from_directory(folder, filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'msg': 'File not found'}), 404




