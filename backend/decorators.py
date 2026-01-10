from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps

def role_required(allowed_roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user = get_jwt_identity()
            if user["role"] not in allowed_roles:
                return jsonify(message="Access denied ❌"), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

