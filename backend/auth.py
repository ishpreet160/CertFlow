from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import db, User
from werkzeug.security import generate_password_hash

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

#  Register route
@auth_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'employee')  # default to employee if role not provided

    if not name or not email or not password:
        return jsonify(message="Name, email, and password are required."), 400

    if User.query.filter_by(email=email).first():
        return jsonify(message="Email already registered"), 400

    new_user = User(name=name, email=email, role=role, password_hash=generate_password_hash(password))
#added password inside new_user    
    db.session.add(new_user)
    db.session.commit()

    return jsonify(message="User registered successfully"), 201

# Login route
@auth_bp.route('/login', methods=['POST'])
def login():
   
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        token = create_access_token(identity={'id': user.id, 'role': user.role})
        return jsonify(access_token=token)

    return jsonify(message='Invalid email or password'), 401

@auth_bp.route('/ping')
def ping():
    return jsonify(message='auth blueprint is active ')



