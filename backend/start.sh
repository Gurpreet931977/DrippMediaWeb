#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  Dripp Media Backend — One-Command Startup
#  Usage: bash start.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      DRIPP MEDIA — STARTING UP       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Check Python ──────────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "❌  Python 3 is not installed. Please install it from https://python.org"
  exit 1
fi
echo "✅  Python $(python3 --version)"

# ── Set up virtual environment ────────────────────────────────────────────────
if [ ! -d "venv" ]; then
  echo "📦  Creating virtual environment..."
  python3 -m venv venv
fi
source venv/bin/activate
echo "✅  Virtual environment active"

# ── Install / upgrade dependencies ───────────────────────────────────────────
echo "📥  Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅  Dependencies installed"

# ── Copy .env if missing ──────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "⚠️   Created .env from template."
  echo "     Edit backend/.env to add your SMTP credentials before emails will work."
  echo ""
fi

# ── Launch ────────────────────────────────────────────────────────────────────
echo ""
echo "🚀  Starting server..."
echo ""
python3 server.py
