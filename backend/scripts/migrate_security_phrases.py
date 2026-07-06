#!/usr/bin/env python3
"""
migrate_security_phrases.py
One-time migration to bcrypt-hash all plaintext security phrases in Supabase.

Users are stored in Supabase (not local SQLite), so this script uses the
Supabase REST API via the service role key from the .env file.

Usage:
  cd backend
  source venv/bin/activate
  pip install supabase bcrypt python-dotenv
  python3 scripts/migrate_security_phrases.py --dry-run   # preview first
  python3 scripts/migrate_security_phrases.py              # apply
"""

import sys, os, bcrypt
from dotenv import load_dotenv

# Load env vars from backend/.env
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH   = os.path.join(BASE_DIR, '.env')
load_dotenv(ENV_PATH)

SUPABASE_URL      = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY      = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    # Try reading from Final Dripp/.env.local as fallback
    ALT_ENV = os.path.join(BASE_DIR, '..', 'Final Dripp', '.env.local')
    load_dotenv(ALT_ENV)
    SUPABASE_URL  = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    SUPABASE_KEY  = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Could not find SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env files.")
    print("        Set SUPABASE_SERVICE_ROLE_KEY in backend/.env or Final Dripp/.env.local")
    sys.exit(1)

try:
    from supabase import create_client
except ImportError:
    print("[ERROR] supabase package not installed. Run: pip install supabase")
    sys.exit(1)


def migrate(dry_run: bool = False):
    print(f"[INFO] Connecting to Supabase: {SUPABASE_URL}")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all users that have a security_phrase
    res = client.table('users').select('id, email, security_phrase').execute()
    users = [u for u in res.data if u.get('security_phrase')]

    print(f"Found {len(users)} users with a security phrase.\n")
    migrated = skipped = errors = 0

    for user in users:
        uid    = user['id']
        email  = user['email']
        phrase = user['security_phrase']

        # Already bcrypt-hashed — skip safely
        if phrase.startswith('$2'):
            print(f"  [SKIP] {email} — already hashed")
            skipped += 1
            continue

        try:
            hashed = bcrypt.hashpw(phrase.strip().encode(), bcrypt.gensalt(rounds=10)).decode()
            if dry_run:
                print(f"  [DRY]  {email} — would hash (len={len(phrase)})")
            else:
                client.table('users').update({'security_phrase': hashed}).eq('id', uid).execute()
                print(f"  [DONE] {email} — hashed successfully")
            migrated += 1
        except Exception as e:
            print(f"  [ERR]  {email} — {e}")
            errors += 1

    label = "Would migrate" if dry_run else "Migrated"
    print(f"\n{'🔍 Dry run' if dry_run else '✅ Migration'} complete.")
    print(f"   {label}: {migrated}  |  Skipped (already hashed): {skipped}  |  Errors: {errors}")
    if dry_run:
        print("   Run without --dry-run to apply changes.")


if __name__ == '__main__':
    dry_run = '--dry-run' in sys.argv
    print(f"[INFO] {'DRY RUN — no changes will be made.' if dry_run else 'LIVE migration — will modify Supabase.'}\n")
    if not dry_run:
        confirm = input("Type 'yes' to continue: ").strip()
        if confirm.lower() != 'yes':
            print("Aborted.")
            sys.exit(0)
    migrate(dry_run=dry_run)

