"""
db.py — SQLite database helper for Dripp Media backend.
Tables:
  - leads         : contact form / quote requests
  - community     : community email sign-ups
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "dripp.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_conn()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            email       TEXT NOT NULL,
            message     TEXT,
            services    TEXT,          -- JSON array stored as text
            status      TEXT DEFAULT 'new',
            created_at  TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS community (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            email       TEXT NOT NULL UNIQUE,
            expertise   TEXT,
            created_at  TEXT NOT NULL
        )
    """)

    # Try adding expertise column to existing table if it was created earlier
    try:
        c.execute("ALTER TABLE community ADD COLUMN expertise TEXT")
    except sqlite3.OperationalError:
        pass 

    conn.commit()
    conn.close()
    print("[DB] Database initialised at", DB_PATH)


# ─── Leads ────────────────────────────────────────────────────────────────────

def save_lead(name: str, email: str, message: str, services: list) -> int:
    import json
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO leads (name, email, message, services, created_at) VALUES (?, ?, ?, ?, ?)",
        (name, email, message, json.dumps(services), datetime.utcnow().isoformat())
    )
    conn.commit()
    lead_id = c.lastrowid
    conn.close()
    return lead_id


def get_all_leads():
    import json
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM leads ORDER BY created_at DESC")
    rows = c.fetchall()
    conn.close()
    result = []
    for row in rows:
        d = dict(row)
        try:
            d["services"] = json.loads(d["services"]) if d["services"] else []
        except Exception:
            d["services"] = []
        result.append(d)
    return result


def update_lead_status(lead_id: int, status: str):
    conn = get_conn()
    c = conn.cursor()
    c.execute("UPDATE leads SET status = ? WHERE id = ?", (status, lead_id))
    conn.commit()
    conn.close()


# ─── Community ────────────────────────────────────────────────────────────────

def save_community_email(email: str, expertise: str = None) -> bool:
    """Returns True if new signup, False if already exists."""
    conn = get_conn()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO community (email, expertise, created_at) VALUES (?, ?, ?)",
            (email, expertise, datetime.utcnow().isoformat())
        )
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False


def get_all_community():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM community ORDER BY created_at DESC")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows
