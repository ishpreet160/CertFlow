from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps

def role_required(allowed_roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # Ensure a valid JWT is present
            verify_jwt_in_request()
            
            # Extract identity safely
            user = get_jwt_identity()
            
            # Does the identity even exist and have a role?
            if not user or not isinstance(user, dict):
                return jsonify(message="Invalid token identity structure. ❌"), 401
            
            user_role = user.get("role")
            
            # Is the role authorized?
            if user_role not in allowed_roles:
                return jsonify(
                    message=f"Access denied. Required: {allowed_roles}, Your Role: {user_role} ❌"
                ), 403
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper