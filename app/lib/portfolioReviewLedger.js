import fs from 'fs';
import path from 'path';

const LEDGER_FILE = path.join(process.cwd(), 'scratch', 'portfolio_review_ledger.json');

// In-memory cache for fast read/write
let memoryLedger = null;

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
}

export function getReviewLedger() {
  if (memoryLedger !== null) return memoryLedger;
  
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      const data = fs.readFileSync(LEDGER_FILE, 'utf8');
      memoryLedger = JSON.parse(data || '{}');
      return memoryLedger;
    }
  } catch (e) {
    console.warn('Failed to read portfolio review ledger:', e.message);
  }

  // Pre-seed with known missing / 404 items like the Forest MTB reel
  memoryLedger = {
    'e1a79864-2b82-4a0a-b8b2-35272a635700': {
      id: 'e1a79864-2b82-4a0a-b8b2-35272a635700',
      is_visible: false,
      held_for_review: true,
      review_reason: 'Media file not found in storage (HTTP 404)',
      review_date: new Date().toISOString()
    }
  };
  saveReviewLedger(memoryLedger);
  return memoryLedger;
}

export function saveReviewLedger(ledger) {
  memoryLedger = ledger;
  try {
    ensureDirExists(LEDGER_FILE);
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save portfolio review ledger to disk:', e.message);
  }
}

export function setItemReviewStatus(id, { is_visible = false, held_for_review = true, review_reason = '', review_date = new Date().toISOString() } = {}) {
  if (!id) return;
  const ledger = getReviewLedger();
  ledger[id] = {
    id,
    is_visible: Boolean(is_visible),
    held_for_review: Boolean(held_for_review),
    review_reason: review_reason || (held_for_review ? 'Held for review' : null),
    review_date: review_date || new Date().toISOString()
  };
  saveReviewLedger(ledger);
  return ledger[id];
}

export function clearItemReviewStatus(id) {
  if (!id) return;
  const ledger = getReviewLedger();
  if (ledger[id]) {
    delete ledger[id];
    saveReviewLedger(ledger);
  }
}

export function applyLedgerToItems(items = []) {
  const ledger = getReviewLedger();
  return items.map(item => {
    const override = ledger[item.id];
    if (override) {
      return {
        ...item,
        is_visible: override.is_visible !== undefined ? override.is_visible : item.is_visible,
        held_for_review: override.held_for_review !== undefined ? override.held_for_review : item.held_for_review,
        review_reason: override.review_reason || item.review_reason || null,
        review_date: override.review_date || item.review_date || null
      };
    }
    return item;
  });
}
