"""
routes/contact.py — POST /api/contact
Handles enquiry form submissions: saves lead + fires emails.
"""

from flask import Blueprint, request, jsonify
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from db import save_lead
from emailer import send_agency_notification, send_client_autoreply

contact_bp = Blueprint("contact", __name__)


def _validate(data: dict):
    errors = []
    if not data.get("name", "").strip():
        errors.append("Name is required.")
    email = data.get("email", "").strip()
    if not email or "@" not in email:
        errors.append("A valid email is required.")
    if not data.get("message", "").strip() and not data.get("services"):
        errors.append("Please include a message or select at least one service.")
    return errors


@contact_bp.route("/api/contact", methods=["POST"])
def submit_contact():
    data = request.get_json(silent=True) or {}

    errors = _validate(data)
    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    name     = data["name"].strip()
    email    = data["email"].strip()
    message  = data.get("message", "").strip()
    services = data.get("services", [])
    if isinstance(services, str):
        services = [s.strip() for s in services.split(",") if s.strip()]

    lead_id = save_lead(name, email, message, services)
    lead = {"id": lead_id, "name": name, "email": email,
            "message": message, "services": services}

    # Fire emails (non-blocking — errors won't fail the request)
    try:
        send_agency_notification(lead)
        send_client_autoreply(lead)
    except Exception as e:
        print(f"[CONTACT] Email error: {e}")

    return jsonify({
        "success": True,
        "message": f"Thanks {name}! We'll be in touch within 24–48 hours.",
        "lead_id": lead_id
    }), 201
