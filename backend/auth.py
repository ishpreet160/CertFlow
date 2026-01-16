from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from extensions import db
from functools import wraps

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register_user():
    """
    Logic:
    - Admin creates Managers or Employees.
    - Managers create Employees (automatically assigned to that Manager).
    - Employees: Restricted.
    """
    creator_info = get_jwt_identity()
    creator_role = creator_info.get('role')
    creator_id = creator_info.get('id')

    data = request.get_json()
    if not data:
        return jsonify(message="No input data provided"), 400

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    requested_role = data.get('role', 'employee')

    # 1. Basic Validation
    if not all([name, email, password]):
        return jsonify(message="Name, email, and password are required."), 400
    
    # 2. Hierarchy Logic 
    if requested_role == 'admin':
        return jsonify(message="Admins cannot be created via API."), 403
    
    if requested_role == 'manager' and creator_role != 'admin':
        return jsonify(message="Only Admins can register Managers."), 403
    
    if requested_role == 'employee' and creator_role not in ['admin', 'manager']:
        return jsonify(message="Unauthorized to create employees."), 403

    # 3. Duplicate Check
    if User.query.filter_by(email=email).first():
        return jsonify(message="User already exists."), 400

    try:
        # If a manager creates an employee, they are the manager. 
        # If an admin creates an employee, we check if a manager_id was passed in data.
        target_manager_id = None
        if requested_role == 'employee':
            target_manager_id = creator_id if creator_role == 'manager' else data.get('manager_id')

        new_user = User(
            name=name, 
            email=email, 
            role=requested_role,
            manager_id=target_manager_id
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        return jsonify(message=f"{requested_role.capitalize()} registered successfully"), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Server error: {str(e)}"), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data: return jsonify(message="Missing JSON"), 400

    user = User.query.filter_by(email=data.get('email')).first()
    
    if user and user.check_password(data.get('password')):
        # CRITICAL: This dict matches the decorator expectation
        identity = {'id': user.id, 'role': user.role}
        token = create_access_token(identity=identity)
        
        return jsonify({
            'access_token': token,
            'user': {
                'id': user.id,
                'name': user.name,
                'role': user.role
            }
        }), 200

    return jsonify(message='Invalid credentials'), 401

@auth_bp.route('/ping')
def ping():
    return jsonify(message='Auth system online')