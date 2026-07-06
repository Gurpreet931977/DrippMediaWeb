"""
routes/community.py — POST /api/community
Handles community email sign-ups.
"""

from flask import Blueprint, request, jsonify
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from db import save_community_email
from emailer import send_community_welcome

community_bp = Blueprint("community", __name__)


@community_bp.route("/api/community", methods=["POST"])
def join_community():
    data  = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    expertise = data.get("expertise", "").strip()

    if not email or "@" not in email:
        return jsonify({"success": False, "error": "A valid email is required."}), 400

    is_new = save_community_email(email, expertise)

    if is_new:
        try:
            send_community_welcome(email)
        except Exception as e:
            print(f"[COMMUNITY] Welcome email error: {e}")
        return jsonify({
            "success": True,
            "message": "You're in the Collective! Check your inbox. 🖤"
        }), 201
    else:
        return jsonify({
            "success": True,
            "message": "You're already part of the family! 🖤"
        }), 200
