"""
routes/admin.py — /admin dashboard + /admin/status (lead status update)
Password-protected with HMAC-signed HttpOnly cookie.
"""

from flask import Blueprint, request, redirect, url_for, make_response, abort
import sys, os, json, hmac, hashlib
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from db import get_all_leads, get_all_community, update_lead_status

admin_bp = Blueprint("admin", __name__)

ADMIN_PASSWORD  = os.getenv("ADMIN_PASSWORD", "")
COOKIE_SECRET   = os.getenv("SECRET_KEY", "")
COOKIE_NAME     = "dripp_admin_auth"
_IS_PROD        = os.getenv("FLASK_ENV", "development") == "production"


def _make_auth_token():
    """Generate an HMAC token binding the admin password to the cookie secret."""
    if not ADMIN_PASSWORD or not COOKIE_SECRET:
        raise RuntimeError("ADMIN_PASSWORD or SECRET_KEY env var not set")
    return hmac.new(
        COOKIE_SECRET.encode(),
        ADMIN_PASSWORD.encode(),
        hashlib.sha256
    ).hexdigest()


def _is_authed():
    """Verify the admin session cookie contains the expected HMAC token."""
    token = request.cookies.get(COOKIE_NAME, "")
    if not token:
        return False
    expected = _make_auth_token()
    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(token, expected)


def _status_badge(status):
    colors = {
        "new":        ("#ebd73f", "#050505"),
        "in_progress":("#3f9eeb", "#050505"),
        "completed":  ("#3feb7c", "#050505"),
        "archived":   ("#555",    "#ccc"),
    }
    bg, fg = colors.get(status, ("#333", "#ccc"))
    label = status.replace("_", " ").title()
    return f'<span style="background:{bg};color:{fg};padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;">{label}</span>'


def _render_dashboard(leads, community):
    total     = len(leads)
    new_count = sum(1 for l in leads if l["status"] == "new")
    done      = sum(1 for l in leads if l["status"] == "completed")
    subs      = len(community)

    # Build leads rows
    lead_rows = ""
    for l in leads:
        svcs = l.get("services", [])
        svcs_html = "".join(
            f'<span style="background:#ebd73f22;border:1px solid #ebd73f55;color:#ebd73f;'
            f'padding:2px 10px;border-radius:20px;font-size:11px;margin:2px;display:inline-block;">{s}</span>'
            for s in svcs
        ) or "<span style='color:#444'>—</span>"

        lead_rows += f"""
        <tr>
          <td style="padding:14px 16px;color:#888;font-size:12px;">#{l['id']}</td>
          <td style="padding:14px 16px;">
            <div style="font-weight:600;color:#fff;font-size:14px;">{l['name']}</div>
            <a href="mailto:{l['email']}" style="color:#ebd73f;font-size:12px;text-decoration:none;">{l['email']}</a>
          </td>
          <td style="padding:14px 16px;max-width:300px;">
            <div style="color:#aaa;font-size:13px;line-height:1.5;white-space:pre-wrap;">{l.get('message','') or '—'}</div>
            <div style="margin-top:6px;">{svcs_html}</div>
          </td>
          <td style="padding:14px 16px;">{_status_badge(l.get('status','new'))}</td>
          <td style="padding:14px 16px;">
            <form method="POST" action="/admin/status" style="display:inline;">
              <input type="hidden" name="lead_id" value="{l['id']}"/>
              <select name="status" onchange="this.form.submit()"
                style="background:#1a1a1a;border:1px solid #333;color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer;">
                {"".join(f'<option value="{s}" {"selected" if s==l.get("status","new") else ""}>{s.replace("_"," ").title()}</option>' for s in ["new","in_progress","completed","archived"])}
              </select>
            </form>
          </td>
          <td style="padding:14px 16px;color:#555;font-size:11px;">{l.get('created_at','')[:16].replace('T',' ')}</td>
        </tr>
        """

    # Build community rows
    comm_rows = "".join(
        f'<tr><td style="padding:10px 16px;color:#888;font-size:12px;">#{r["id"]}</td>'
        f'<td style="padding:10px 16px;color:#ebd73f;font-size:13px;">{r["email"]}</td>'
        f'<td style="padding:10px 16px;color:#555;font-size:12px;">{r["created_at"][:16].replace("T"," ")}</td></tr>'
        for r in community
    ) or '<tr><td colspan="3" style="padding:20px;text-align:center;color:#444;">No sign-ups yet</td></tr>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Dripp Media — Admin</title>
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap" rel="stylesheet"/>
  <style>
    *{{margin:0;padding:0;box-sizing:border-box;}}
    body{{background:#050505;color:#fff;font-family:'Clash Display',sans-serif;min-height:100vh;}}
    .topbar{{background:#0d0d0d;border-bottom:1px solid #1a1a1a;padding:16px 32px;display:flex;justify-content:space-between;align-items:center;}}
    .logo{{color:#ebd73f;font-size:20px;font-weight:700;letter-spacing:4px;}}
    .logout{{color:#555;font-size:12px;letter-spacing:1px;text-decoration:none;border:1px solid #222;padding:6px 16px;border-radius:6px;transition:.2s;}}
    .logout:hover{{border-color:#ebd73f;color:#ebd73f;}}
    .container{{max-width:1300px;margin:0 auto;padding:32px;}}
    .stat-grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;}}
    .stat{{background:#0d0d0d;border:1px solid #1a1a1a;border-radius:12px;padding:20px 24px;}}
    .stat-num{{font-size:36px;font-weight:700;color:#ebd73f;}}
    .stat-label{{color:#555;font-size:12px;letter-spacing:1px;margin-top:4px;}}
    .section-head{{font-size:13px;letter-spacing:2px;color:#555;text-transform:uppercase;margin-bottom:16px;}}
    .card{{background:#0d0d0d;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;margin-bottom:32px;}}
    table{{width:100%;border-collapse:collapse;}}
    thead th{{background:#111;padding:12px 16px;text-align:left;font-size:11px;letter-spacing:1.5px;color:#555;font-weight:600;border-bottom:1px solid #1a1a1a;}}
    tbody tr{{border-bottom:1px solid #111;transition:.15s;}}
    tbody tr:hover{{background:#0a0a0a;}}
    tbody tr:last-child{{border:none;}}
    @media(max-width:768px){{.stat-grid{{grid-template-columns:1fr 1fr;}}}}
  </style>
</head>
<body>
  <div class="topbar">
    <span class="logo">DRIPP ADMIN</span>
    <a href="/admin/logout" class="logout">LOGOUT</a>
  </div>
  <div class="container">
    <div class="stat-grid">
      <div class="stat"><div class="stat-num">{total}</div><div class="stat-label">TOTAL LEADS</div></div>
      <div class="stat"><div class="stat-num">{new_count}</div><div class="stat-label">NEW</div></div>
      <div class="stat"><div class="stat-num">{done}</div><div class="stat-label">COMPLETED</div></div>
      <div class="stat"><div class="stat-num">{subs}</div><div class="stat-label">COMMUNITY</div></div>
    </div>

    <p class="section-head">📋 Enquiries &amp; Leads</p>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>CLIENT</th><th>MESSAGE &amp; SERVICES</th><th>STATUS</th><th>UPDATE</th><th>DATE</th>
          </tr>
        </thead>
        <tbody>
          {lead_rows or '<tr><td colspan="6" style="padding:32px;text-align:center;color:#444;">No leads yet — share the site link!</td></tr>'}
        </tbody>
      </table>
    </div>

    <p class="section-head">🖤 Community Sign-ups</p>
    <div class="card">
      <table>
        <thead><tr><th>ID</th><th>EMAIL</th><th>DATE</th></tr></thead>
        <tbody>{comm_rows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>"""


# ─── Routes ───────────────────────────────────────────────────────────────────

LOGIN_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Dripp Admin — Login</title>
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,600,700&display=swap" rel="stylesheet"/>
  <style>
    *{{margin:0;padding:0;box-sizing:border-box;}}
    body{{background:#050505;color:#fff;font-family:'Clash Display',sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;}}
    .box{{background:#0d0d0d;border:1px solid #1a1a1a;border-radius:16px;padding:48px 40px;width:360px;text-align:center;}}
    .logo{{font-size:22px;letter-spacing:6px;color:#ebd73f;font-weight:700;margin-bottom:8px;}}
    .sub{{color:#444;font-size:12px;letter-spacing:2px;margin-bottom:32px;}}
    .err{{background:#ff333320;border:1px solid #ff3333;color:#ff6666;padding:10px;border-radius:8px;font-size:13px;margin-bottom:20px;display:none;}}
    input{{width:100%;background:#111;border:1px solid #222;color:#fff;padding:14px 16px;border-radius:10px;font-size:14px;font-family:inherit;outline:none;transition:.2s;}}
    input:focus{{border-color:#ebd73f;}}
    button{{width:100%;background:#ebd73f;color:#050505;border:none;padding:14px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:2px;cursor:pointer;margin-top:16px;font-family:inherit;transition:.2s;}}
    button:hover{{background:#d4c238;}}
  </style>
</head>
<body>
  <div class="box">
    <div class="logo">DRIPP</div>
    <div class="sub">ADMIN DASHBOARD</div>
    {error}
    <form method="POST" action="/admin/login">
      <input type="password" name="password" placeholder="Enter password" required autofocus/>
      <button type="submit">ENTER</button>
    </form>
  </div>
</body>
</html>"""


@admin_bp.route("/admin")
def admin_dashboard():
    if not _is_authed():
        return redirect("/admin/login")
    leads     = get_all_leads()
    community = get_all_community()
    return _render_dashboard(leads, community)


@admin_bp.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        pw = request.form.get("password", "")
        if pw == ADMIN_PASSWORD:
            try:
                token = _make_auth_token()
            except RuntimeError as e:
                return LOGIN_PAGE.format(error=f'<div class="err" style="display:block;">Server configuration error.</div>'), 500
            resp = make_response(redirect("/admin"))
            resp.set_cookie(
                COOKIE_NAME,
                token,
                httponly=True,
                max_age=60 * 60 * 8,
                samesite="Strict",
                secure=_IS_PROD,   # Secure flag only in production (HTTPS)
            )
            return resp
        # Log failed attempts without exposing details to the client
        print(f"[admin] Failed login attempt from IP: {request.remote_addr}")
        return LOGIN_PAGE.format(error='<div class="err" style="display:block;">Incorrect password.</div>'), 401
    return LOGIN_PAGE.format(error="")


@admin_bp.route("/admin/logout")
def admin_logout():
    resp = make_response(redirect("/admin/login"))
    resp.delete_cookie(COOKIE_NAME)
    return resp


@admin_bp.route("/admin/status", methods=["POST"])
def update_status():
    if not _is_authed():
        abort(403)
    lead_id = request.form.get("lead_id")
    status  = request.form.get("status")
    if lead_id and status in ["new", "in_progress", "completed", "archived"]:
        update_lead_status(int(lead_id), status)
    return redirect("/admin")
