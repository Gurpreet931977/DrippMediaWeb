/**
 * scoreGuard.js
 * Anti-cheat score integrity system for the Dripp Drop game.
 *
 * Strategy:
 *  1. Shadow checksum  – two independent shadow refs XOR'd with a salt
 *  2. Rate-gate        – max one score event per 50 ms (human-impossible to beat legitimately)
 *  3. Delta validation – each increment must be exactly 1, 5 or 69 (legal values only)
 *  4. Monotonic guard  – score may never decrease (drops only go up)
 *  5. Tampering flag   – any violation sets a permanent "cheated" flag that poisons
 *                        the display and blocks the share flow
 */

const LEGAL_DELTAS = new Set([1, 5, 69]);
const MIN_MS_BETWEEN_HITS = 50; // ~20 catches/sec absolute max for any human
const XOR_SALT = 0x44727070; // "Drpp" in hex – obfuscates shadow values in memory

export function createScoreGuard() {
  let _primary   = 0;         // primary running total
  let _shadow    = 0 ^ XOR_SALT; // XOR'd shadow copy
  let _lastHitTs = 0;         // timestamp of last accepted hit
  let _cheated   = false;     // permanent cheat flag
  let _hitCount  = 0;         // total accepted hits

  /** Internal checksum – both refs must agree at all times */
  function _checkIntegrity() {
    const recovered = _shadow ^ XOR_SALT;
    if (recovered !== _primary) {
      _cheated = true;
      return false;
    }
    return true;
  }

  /**
   * tryAddScore(delta)
   *  delta  : points to add (must be 1, 5 or 69)
   * Returns : { ok: boolean, score: number, cheated: boolean }
   */
  function tryAddScore(delta) {
    // Already flagged – refuse everything
    if (_cheated) return { ok: false, score: _primary, cheated: true };

    // Integrity check before mutating
    if (!_checkIntegrity()) return { ok: false, score: _primary, cheated: true };

    // Only legal deltas allowed
    if (!LEGAL_DELTAS.has(delta)) {
      _cheated = true;
      return { ok: false, score: _primary, cheated: true };
    }

    // Rate-gate
    const now = performance.now();
    if (now - _lastHitTs < MIN_MS_BETWEEN_HITS) {
      // Too fast – silent drop, not a cheat flag (lag / multi-hit frame)
      return { ok: false, score: _primary, cheated: false };
    }
    _lastHitTs = now;

    // Commit
    _primary += delta;
    _shadow   = _primary ^ XOR_SALT;
    _hitCount++;

    return { ok: true, score: _primary, cheated: false };
  }

  /** Validate + return current score; poisons on mismatch */
  function getScore() {
    if (!_checkIntegrity()) return { score: 0, cheated: true };
    return { score: _primary, cheated: false };
  }

  /** Hard reset (called on game restart) */
  function reset() {
    _primary   = 0;
    _shadow    = 0 ^ XOR_SALT;
    _lastHitTs = 0;
    _cheated   = false;
    _hitCount  = 0;
  }

  /** How many real hits were registered */
  function getHitCount() { return _hitCount; }

  /** Has the session been flagged as cheated? */
  function isCheated() { return _cheated; }

  return { tryAddScore, getScore, reset, getHitCount, isCheated };
}
