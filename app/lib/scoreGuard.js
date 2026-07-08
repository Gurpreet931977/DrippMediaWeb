/**
 * scoreGuard.js
 * Anti-cheat score integrity system for the Dripp Drop game.
 *
 * CLIENT-SIDE strategy (first line of defence):
 *  1. Shadow checksum  – two independent shadow refs XOR'd with a salt
 *  2. Rate-gate        – max one score event per 50 ms (human-impossible to beat legitimately)
 *  3. Delta validation – each increment must be exactly 1, 5 or 69 (legal values only)
 *  4. Monotonic guard  – score may never decrease (drops only go up)
 *  5. Tampering flag   – any violation sets a permanent "cheated" flag that poisons
 *                        the display and blocks the share flow
 *
 * SERVER-SIDE strategy (second line of defence via /api/submit-score):
 *  6. HMAC session token – a token is generated at session start using
 *     the user's email + sessionStart timestamp; the server verifies it
 *     so no one can submit a score without having started a genuine session.
 *  7. Physics caps & hit-count plausibility – enforced on the server
 */

const LEGAL_DELTAS = new Set([1, 5, 69]);
const MIN_MS_BETWEEN_HITS = 50; // ~20 catches/sec absolute max for any human
const XOR_SALT = 0x44727070; // "Drpp" in hex – obfuscates shadow values in memory

export function createScoreGuard() {
  let _primary   = 0;             // primary running total
  let _shadow    = 0 ^ XOR_SALT;  // XOR'd shadow copy
  let _lastHitTs = 0;             // timestamp of last accepted hit
  let _cheated   = false;         // permanent cheat flag
  let _hitCount  = 0;             // total accepted hits

  // Session token fields – set once per game session by calling initSession()
  let _sessionStart = 0;
  let _sessionToken = null;
  let _scoreCommit  = null; // score-commit HMAC fetched just before submission

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
   * initSession(email)
   *  Call once at game start to bind this guard instance to the logged-in user.
   *  Fetches an HMAC token from the server (via /api/session-token) so we
   *  don't have to embed the secret in client-side code.
   */
  async function initSession(email) {
    if (!email) return;
    _sessionStart = Date.now();
    try {
      // Read the server-issued identity token — set by AuthModal on login/signup
      const authToken = (typeof window !== 'undefined')
        ? localStorage.getItem('dripp_auth_token') || ''
        : '';

      const res = await fetch('/api/session-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Prove to the server that we own this email
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ email, sessionStart: _sessionStart }),
      });
      if (res.ok) {
        const data = await res.json();
        _sessionToken = data.token || null;
      }
    } catch (e) {
      // If the request fails, the server will reject any submission – acceptable
      _sessionToken = null;
    }
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
    _primary      = 0;
    _shadow       = 0 ^ XOR_SALT;
    _lastHitTs    = 0;
    _cheated      = false;
    _hitCount     = 0;
    _sessionStart = 0;
    _sessionToken = null;
    _scoreCommit  = null;
  }

  /** How many real hits were registered */
  function getHitCount() { return _hitCount; }

  /** Has the session been flagged as cheated? */
  function isCheated() { return _cheated; }

  /**
   * commitScore(email)
   *  Call at game end (before submitting) to get a server-signed score-commit HMAC.
   *  This cryptographically binds the current score to the session, preventing
   *  replay attacks where a real token is submitted with a fabricated score.
   *  Returns true if the commit was successfully obtained, false otherwise.
   */
  async function commitScore(email) {
    if (_cheated || !_checkIntegrity()) return false;
    if (!email || !_sessionToken || !_sessionStart) return false;
    try {
      const authToken = (typeof window !== 'undefined')
        ? localStorage.getItem('dripp_auth_token') || ''
        : '';
      const res = await fetch('/api/session-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          email,
          sessionStart: _sessionStart,
          finalScore: _primary,
          sessionToken: _sessionToken,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        _scoreCommit = data.scoreCommit || null;
        return !!_scoreCommit;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * getSubmissionPayload(email)
   * Returns the payload needed for /api/submit-score.
   * Returns null if the session was flagged as cheated or scoreCommit wasn't obtained.
   * IMPORTANT: call commitScore(email) first and await it before calling this.
   */
  function getSubmissionPayload(email) {
    if (_cheated || !_checkIntegrity()) return null;
    if (!_scoreCommit) return null; // scoreCommit required — call commitScore() first
    return {
      email,
      score:        _primary,
      hitCount:     _hitCount,
      sessionStart: _sessionStart,
      token:        _sessionToken,
      scoreCommit:  _scoreCommit,
    };
  }

  return { tryAddScore, getScore, reset, getHitCount, isCheated, initSession, commitScore, getSubmissionPayload };
}
