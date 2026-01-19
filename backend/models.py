from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db  

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), default='employee') # admin, manager, employee
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
   
    employees = db.relationship('User', 
                                backref=db.backref('manager', remote_side=[id]),
                                foreign_keys=[manager_id])
    
    # Relationships
    uploads = db.relationship('Upload', backref='user', lazy=True, cascade="all, delete-orphan")
  
    certificates = db.relationship('Certificate', backref='owner', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Upload(db.Model):
    __tablename__ = 'uploads'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow) # executes on creation
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

 
    tcil_certificate = db.relationship('TCILCertificate', back_populates='upload', uselist=False, cascade="all, delete-orphan")
    certificate = db.relationship('Certificate', back_populates='upload', uselist=False, cascade="all, delete-orphan")

class Certificate(db.Model):
    __tablename__ = 'certificates'

    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.Integer, db.ForeignKey('uploads.id'), nullable=False) 
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    title = db.Column(db.String(200), nullable=False)
    client = db.Column(db.String(100), nullable=False)
    nature_of_project = db.Column(db.String(100), nullable=True)
    sub_nature_of_project = db.Column(db.String(100), nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    go_live_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    warranty_years = db.Column(db.String(20), nullable=True)
    om_years = db.Column(db.String(20), nullable=True)
    value = db.Column(db.String(50), nullable=True)
    project_status = db.Column(db.String(50), nullable=True)
    tcil_contact_person = db.Column(db.String(100), nullable=True)
    technologies = db.Column(db.String(500), nullable=True)
    concerned_hod = db.Column(db.String(100), nullable=True)
    client_contact_name = db.Column(db.String(100), nullable=True)
    client_contact_phone = db.Column(db.String(20), nullable=True)
    client_contact_email = db.Column(db.String(120), nullable=True)
    
    filename = db.Column(db.String(256), nullable=False)
    status = db.Column(db.String(20), default='pending')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

  
    upload = db.relationship("Upload", back_populates="certificate")

    user = db.relationship('User', overlaps="certificates,owner")

class TCILCertificate(db.Model):
    __tablename__ = 'tcil_certificates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    valid_from = db.Column(db.Date, nullable=False)
    valid_till = db.Column(db.Date, nullable=False)
    pdf_path = db.Column(db.Text, nullable=False)

    upload_id = db.Column(db.Integer, db.ForeignKey('uploads.id'))
    upload = db.relationship('Upload', back_populates='tcil_certificate')