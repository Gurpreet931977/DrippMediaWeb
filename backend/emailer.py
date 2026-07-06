"""
emailer.py — SMTP email helper for Dripp Media backend.
Sends:
  - Agency notification when a new enquiry arrives
  - Auto-reply confirmation to the client
"""

import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _get_config():
    return {
        "host":          os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port":          int(os.getenv("SMTP_PORT", 587)),
        "user":          os.getenv("SMTP_USER", ""),
        "password":      os.getenv("SMTP_PASS", ""),
        "agency_email":  os.getenv("AGENCY_EMAIL", "mediadripp@gmail.com"),
    }


def _send(to: str, subject: str, html_body: str, text_body: str = ""):
    cfg = _get_config()
    if not cfg["user"] or not cfg["password"]:
        print(f"[EMAIL] SMTP not configured — skipping send to {to}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"Dripp Media <{cfg['user']}>"
    msg["To"]      = to

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
            server.ehlo()
            server.starttls()
            server.login(cfg["user"], cfg["password"])
            server.sendmail(cfg["user"], to, msg.as_string())
        print(f"[EMAIL] ✓ Sent '{subject}' → {to}")
        return True
    except Exception as e:
        print(f"[EMAIL] ✗ Failed to send to {to}: {e}")
        return False


# ─── Agency Notification ──────────────────────────────────────────────────────

def send_agency_notification(lead: dict):
    cfg = _get_config()
    services_html = "".join(
        f'<span style="display:inline-block;background:#ebd73f20;border:1px solid #ebd73f;color:#ebd73f;'
        f'padding:4px 12px;border-radius:20px;font-size:13px;margin:3px;">{s}</span>'
        for s in lead.get("services", [])
    ) or "<em style='color:#666'>None selected</em>"

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#0d0d0d;border:1px solid #222;border-radius:16px;overflow:hidden;">
        <div style="background:#ebd73f;padding:24px 32px;">
          <h1 style="margin:0;color:#050505;font-size:22px;font-weight:800;letter-spacing:2px;">
            DRIPP MEDIA — NEW ENQUIRY
          </h1>
        </div>
        <div style="padding:32px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#888;font-size:13px;width:100px;">NAME</td>
              <td style="padding:10px 0;color:#fff;font-size:15px;font-weight:600;">{lead['name']}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#888;font-size:13px;">EMAIL</td>
              <td style="padding:10px 0;color:#ebd73f;font-size:15px;">
                <a href="mailto:{lead['email']}" style="color:#ebd73f;text-decoration:none;">{lead['email']}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#888;font-size:13px;vertical-align:top;">MESSAGE</td>
              <td style="padding:10px 0;color:#ccc;font-size:14px;line-height:1.6;">{lead.get('message','—')}</td>
            </tr>
          </table>
          <div style="margin-top:24px;border-top:1px solid #222;padding-top:24px;">
            <p style="color:#888;font-size:12px;letter-spacing:1px;margin:0 0 12px;">REQUESTED SERVICES</p>
            <div>{services_html}</div>
          </div>
          <div style="margin-top:28px;">
            <a href="mailto:{lead['email']}?subject=Re: Your Dripp Media Enquiry"
               style="display:inline-block;background:#ebd73f;color:#050505;padding:12px 28px;border-radius:8px;
                      font-weight:700;font-size:14px;text-decoration:none;letter-spacing:1px;">
              REPLY TO CLIENT
            </a>
          </div>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #1a1a1a;">
          <p style="color:#444;font-size:11px;margin:0;">Lead ID #{lead.get('id','?')} · {lead.get('created_at','')[:10]} · Dripp Media Backend</p>
        </div>
      </div>
    </body>
    </html>
    """

    _send(
        to=cfg["agency_email"],
        subject=f"🎯 New Enquiry from {lead['name']} — Dripp Media",
        html_body=html,
        text_body=f"New enquiry from {lead['name']} ({lead['email']})\n\n{lead.get('message','')}\n\nServices: {', '.join(lead.get('services',[]))}"
    )


# ─── Client Auto-Reply ────────────────────────────────────────────────────────

def send_client_autoreply(lead: dict):
    services_list = "".join(
        f"<li style='padding:4px 0;color:#ccc;'>{s}</li>"
        for s in lead.get("services", [])
    ) or "<li style='color:#666;'>No specific services selected</li>"

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#0d0d0d;border:1px solid #222;border-radius:16px;overflow:hidden;">
        <div style="background:#050505;padding:32px;text-align:center;border-bottom:1px solid #1a1a1a;">
          <h1 style="margin:0 0 4px;color:#ebd73f;font-size:28px;font-weight:900;letter-spacing:4px;">DRIPP</h1>
          <p style="margin:0;color:#555;font-size:11px;letter-spacing:3px;">MEDIA AGENCY</p>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 16px;">
            Hey {lead['name']}, we've got your enquiry! 🎉
          </h2>
          <p style="color:#aaa;font-size:14px;line-height:1.8;margin:0 0 24px;">
            Thanks for reaching out to Dripp Media. We've received your message and our team will 
            get back to you within <strong style="color:#fff;">24–48 hours</strong>. We're genuinely 
            excited to hear about your project!
          </p>
          <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
            <p style="color:#888;font-size:11px;letter-spacing:1px;margin:0 0 12px;">YOUR SELECTED SERVICES</p>
            <ul style="margin:0;padding-left:18px;list-style:disc;">
              {services_list}
            </ul>
          </div>
          <p style="color:#aaa;font-size:14px;line-height:1.8;">
            In the meantime, feel free to check out our portfolio or connect with us on social media.
          </p>
          <div style="margin-top:32px;text-align:center;">
            <a href="mailto:mediadripp@gmail.com"
               style="display:inline-block;background:#ebd73f;color:#050505;padding:14px 32px;border-radius:8px;
                      font-weight:800;font-size:14px;text-decoration:none;letter-spacing:1px;">
              REPLY TO THIS EMAIL
            </a>
          </div>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #1a1a1a;text-align:center;">
          <p style="color:#333;font-size:11px;margin:0;">© 2026 Dripp Media · mediadripp@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
    """

    _send(
        to=lead["email"],
        subject="We got your message — Dripp Media 🖤",
        html_body=html,
        text_body=f"Hey {lead['name']}, thanks for reaching out to Dripp Media! We'll get back to you within 24-48 hours.\n\nTeam Dripp"
    )


# ─── Community Welcome ────────────────────────────────────────────────────────

def send_community_welcome(email: str):
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#0d0d0d;border:1px solid #222;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#ebd73f,#f39c12);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#050505;font-size:24px;font-weight:900;letter-spacing:3px;">WELCOME TO THE DRIPP COLLECTIVE</h1>
        </div>
        <div style="padding:40px 32px;text-align:center;">
          <p style="color:#fff;font-size:18px;font-weight:600;margin:0 0 16px;">You're officially part of the family. 🖤</p>
          <p style="color:#aaa;font-size:14px;line-height:1.8;margin:0 0 28px;">
            Get ready for exclusive drops, premium creative resources, behind-the-scenes content, 
            and early access to everything Dripp Media creates. Pure creative chaos awaits.
          </p>
          <a href="mailto:mediadripp@gmail.com"
             style="display:inline-block;background:#ebd73f;color:#050505;padding:14px 32px;border-radius:8px;
                    font-weight:800;font-size:14px;text-decoration:none;letter-spacing:1px;">
            SAY HI TO THE TEAM
          </a>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #1a1a1a;text-align:center;">
          <p style="color:#333;font-size:11px;margin:0;">© 2026 Dripp Media · You subscribed as {email}</p>
        </div>
      </div>
    </body>
    </html>
    """
    _send(
        to=email,
        subject="Welcome to the Dripp Collective 🖤",
        html_body=html,
        text_body="Welcome to the Dripp Collective! You're officially part of the family. Stay tuned for exclusive content and resources."
    )
