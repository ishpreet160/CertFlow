from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from extensions import db
from datetime import timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# --- PUBLIC ROUTES (No Token Needed) ---

@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Public Registration: Allows new users to join
    """
    data = request.get_json()
    if not data:
        return jsonify(message="No input data provided"), 400

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    # Use the manager_id sent from the frontend dropdown
    manager_id = data.get('manager_id') 

    if not all([name, email, password]):
        return jsonify(message="Name, email, and password are required."), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify(message="User already exists."), 400

    try:
        # Public signups default to 'employee'
        # Prevent privilege escalation to 'admin' via API manipulation
        new_user = User(
            name=name, 
            email=email, 
            role='employee', 
            manager_id=manager_id
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        return jsonify(message="Employee registered successfully"), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Server error: {str(e)}"), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data: return jsonify(message="Missing JSON"), 400

    user = User.query.filter_by(email=data.get('email')).first()
    
    if user and user.check_password(data.get('password')):
        # identity dict must match what your role_required decorator expects
        identity = {'id': user.id, 'role': user.role}
        token = create_access_token(identity=identity, expires_delta=timedelta(hours=24))
        
        return jsonify({
            'access_token': token,
            'user': {
                'id': user.id,
                'name': user.name,
                'role': user.role
            }
        }), 200

    return jsonify(message='Invalid credentials'), 401


@auth_bp.route('/managers', methods=['GET'])
def get_managers():
    """
    Public endpoint to populate the 'Report To' dropdown in Registration.
    """
    managers = User.query.filter(User.role.in_(['manager', 'admin'])).all()
    return jsonify([{"id": m.id, "name": m.name, "role": m.role} for m in managers]), 200


@auth_bp.route('/ping')
def ping():
    return jsonify(message='Auth system online')