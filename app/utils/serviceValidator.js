/**
 * serviceValidator.js
 * Validates user-submitted custom service names.
 * Blocks:
 *  - Profanity, vulgarities, NSFW, slurs (English & Hinglish)
 *  - Pranks, meme jokes, internet troll phrases (e.g. "deez nuts", "your mom", "skibidi", "hawk tuah", etc.)
 *  - Potty humor, dismissive phrases, fake test submissions
 *  - Obfuscation attempts (leetspeak, spaced characters: "f u c k", "b!tch", etc.)
 *  - Gibberish, keyboard smashing, and non-service junk
 */

// Whitelisted legitimate short creative/technical acronyms
const ALLOWED_SHORT_TERMS = new Set([
  'ui', 'ux', '3d', '2d', 'ai', 'ar', 'vr', 'pr', 'qa', 'fx', 'cg'
]);

// Severe profanity, vulgarities, slurs, NSFW, and abusive terms (English & Hinglish)
const INAPPROPRIATE_WORDS = [
  // Profanity / Vulgarity (including short/vowelless forms)
  'fuck', 'fucker', 'fucking', 'fucked', 'fuckoff', 'motherfuck', 'motherfucker',
  'fck', 'fk', 'fuk', 'fckn', 'fking',
  'shit', 'shitty', 'bullshit', 'dipshit', 'sht',
  'bitch', 'bitches', 'bitching', 'btch', 'bch',
  'asshole', 'ass', 'bastard', 'cunt', 'cnt', 'dick', 'dck', 'dickhead',
  'pussy', 'pssy', 'cock', 'slut', 'whore', 'jackass', 'dumbass',
  'wanker', 'bollocks', 'twat', 'douche', 'wtf', 'stfu',

  // Adult / NSFW / Sexual
  'porn', 'porno', 'pornography', 'prn', 'xxx', 'sex', 'sexy', 'nude', 'nudes',
  'naked', 'boob', 'boobs', 'tits', 'titties', 'nipple', 'nipples', 'penis',
  'vagina', 'dildo', 'blowjob', 'handjob', 'cum', 'cumming', 'ejaculation',
  'orgasm', 'erotic', 'hentai', 'milf', 'bondage', 'bdsm', 'stripclub',
  'stripper', 'escort', 'escorts', 'onlyfans', 'lingerie', 'anal',

  // Slurs & Hate Speech
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'chink', 'kike', 'spic',

  // Violence & Harm
  'suicide', 'killmyself', 'murder', 'bomb', 'terrorist', 'terrorism',
  'rape', 'rapist', 'pedo', 'pedophile', 'cocaine', 'heroin', 'meth',

  // Hinglish / Hindi Vulgarities
  'chutiya', 'chutia', 'choot', 'chut', 'bhosdike', 'bhosdi', 'bsdk', 'mc',
  'bc', 'madarchod', 'bhenchod', 'behenchod', 'gand', 'gaand', 'gandu',
  'lund', 'lauda', 'loda', 'randi', 'harami', 'kameena', 'kamina', 'saala',
  'muth', 'muthal', 'kutta', 'suar', 'chod', 'chodu'
];

// Masked / asterisked patterns like "f*ck", "b*tch", "s**t", "d**k"
const MASKED_PROFANITY_PATTERNS = [
  /\bf[\*#@!_\.\s]*[u\*#@!_\.\s]*c[\*#@!_\.\s]*k\b/i,
  /\bb[\*#@!_\.\s]*[i\*#@!_\.\s]*t[\*#@!_\.\s]*c[\*#@!_\.\s]*h\b/i,
  /\bs[\*#@!_\.\s]*h[\*#@!_\.\s]*[i\*#@!_\.\s]*t\b/i,
  /\bd[\*#@!_\.\s]*[i\*#@!_\.\s]*c[\*#@!_\.\s]*k\b/i,
  /\bc[\*#@!_\.\s]*[u\*#@!_\.\s]*n[\*#@!_\.\s]*t\b/i,
  /\bp[\*#@!_\.\s]*[u\*#@!_\.\s]*s[\*#@!_\.\s]*s[\*#@!_\.\s]*y\b/i,
  /\ba[\*#@!_\.\s]*s[\*#@!_\.\s]*s[\*#@!_\.\s]*h[\*#@!_\.\s]*o[\*#@!_\.\s]*l[\*#@!_\.\s]*e\b/i,
  /\bp[\*#@!_\.\s]*[o0\*#@!_\.\s]*r[\*#@!_\.\s]*n\b/i
];

// Prank phrases, memes, trolls, potty humor, and joke submissions
const PRANK_AND_JOKE_PHRASES = [
  // Classic Pranks
  'deez nuts', 'deez nutz', 'deez', 'your mom', 'ur mom', 'yo mama', 'your mum', 'ur mum',
  'your dad', 'ur dad', 'ligma', 'sugma', 'sawcon', 'updog', 'candice',
  'ben dover', 'mike hawk', 'hugh jass', 'bofa', 'joe mama',

  // Internet Brainrot & Memes (when submitted as fake services)
  'skibidi', 'gyatt', 'fanum tax', 'rizzler', 'hawk tuah', 'mewing', 'sigmaboy', 'gigachad',

  // Prank / Joke / Meta
  'prank', 'pranked', 'fake service', 'just a prank', 'just for fun', 'for fun',
  'just kidding', 'jk', 'troll', 'trolling', 'rickroll', 'never gonna give you up',
  'nothing', 'idk', 'i dont know', 'whatever', 'who cares', 'no service',
  'test', 'testing', 'test 123', 'testing 123', 'hello world', 'asdf', 'qwerty',
  'blah blah', 'blah blah blah', 'blah',

  // Potty Humor
  'poop', 'poo poo', 'pee', 'pee pee', 'fart', 'farts', 'booger', 'turd', 'crap', 'diarrhea',

  // Begging / Nonsense
  'free money', 'give me money', 'free stuff', 'hire me', 'send money'
];

/**
 * Normalizes text to defeat simple leetspeak and obfuscation.
 * e.g., "f*ck" -> "fck", "b!tch" -> "bitch", "p0rn" -> "porn", "f u c k" -> "fuck"
 */
function normalizeForSafetyCheck(text) {
  let s = text.toLowerCase();

  // Common leetspeak replacements
  s = s
    .replace(/@/g, 'a')
    .replace(/4/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/\|/g, 'i')
    .replace(/0/g, 'o')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b');

  // Strip non-alphanumeric except spaces
  const cleanSpaced = s.replace(/[^a-z0-9\s]/g, ' ');

  // Detect spaced letters like "f u c k" or "d i c k"
  // If words are single characters separated by spaces, collapse them
  const collapsedSpaced = cleanSpaced.replace(/\b([a-z])\s+(?=[a-z]\b)/g, '$1').replace(/\s+/g, ' ');

  // Strip all non-alphanumeric
  const compact = cleanSpaced.replace(/[^a-z0-9]/g, '');

  // Collapse 3+ repeating characters (e.g. "fuuuuck" -> "fuck", "loool" -> "lol")
  const dedupedCompact = compact.replace(/(.)\1{2,}/g, '$1$1');
  const singleDeduped = compact.replace(/(.)\1+/g, '$1');

  return {
    rawLower: text.toLowerCase().trim(),
    cleanSpaced: cleanSpaced.trim().replace(/\s+/g, ' '),
    collapsedSpaced: collapsedSpaced.trim(),
    compact,
    dedupedCompact,
    singleDeduped
  };
}

/**
 * Main validator for custom services.
 * @param {string} input - User raw input
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateCustomService(input) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'masti mat karo yaar.' };
  }

  const trimmed = input.trim();

  // 1. Length check
  if (trimmed.length < 2) {
    return { isValid: false, error: 'masti mat karo yaar.' };
  }

  const lower = trimmed.toLowerCase();
  if (trimmed.length === 2) {
    if (!ALLOWED_SHORT_TERMS.has(lower)) {
      return { isValid: false, error: 'masti mat karo yaar.' };
    }
  }

  // 2. Alphabetic check (must have at least 2 letters)
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length < 2) {
    return { isValid: false, error: 'masti mat karo yaar.' };
  }

  // 3. Repeated character spam (e.g. "aaaaaa", "11111", ".......")
  if (/(.)\1{3,}/.test(trimmed)) {
    return { isValid: false, error: 'masti mat karo yaar.' };
  }

  // 4. Repeated syllable spam (e.g. "hahaha", "lalala", "hehehe", "lololol")
  if (/(ha|he|la|lol|ja|blah){3,}/i.test(trimmed.replace(/\s+/g, ''))) {
    return { isValid: false, error: 'masti mat karo yaar.' };
  }

  const norm = normalizeForSafetyCheck(trimmed);

  // 5. Check Pranks & Jokes first
  for (const phrase of PRANK_AND_JOKE_PHRASES) {
    const pNorm = phrase.replace(/[^a-z0-9]/g, '');
    // Exact word or substring match
    if (
      norm.cleanSpaced === phrase ||
      norm.collapsedSpaced === phrase ||
      norm.compact === pNorm ||
      norm.singleDeduped.includes(pNorm) ||
      new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'i').test(norm.cleanSpaced) ||
      new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'i').test(norm.collapsedSpaced)
    ) {
      return {
        isValid: false,
        error: 'masti mat karo yaar.'
      };
    }
  }

  // 5.5 Check Masked Profanity Patterns (e.g., f*ck, b*tch, s**t)
  for (const pattern of MASKED_PROFANITY_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(norm.rawLower)) {
      return {
        isValid: false,
        error: 'masti mat karo yaar.'
      };
    }
  }

  // 6. Check Inappropriate / Profanity Words
  for (const word of INAPPROPRIATE_WORDS) {
    const wNorm = word.replace(/[^a-z0-9]/g, '');
    // Exact word boundary in spaced text, or containment in compact forms
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (
      regex.test(norm.cleanSpaced) ||
      regex.test(norm.collapsedSpaced) ||
      norm.compact === wNorm ||
      norm.dedupedCompact.includes(wNorm) ||
      norm.singleDeduped.includes(wNorm)
    ) {
      return {
        isValid: false,
        error: 'masti mat karo yaar.'
      };
    }
  }

  // 7. Consonant keyboard mash check (e.g., "asdfghjkl", "zxcvbnm", "qwrtyp")
  // Words with 6+ consecutive consonants without a single vowel (a, e, i, o, u, y)
  const words = trimmed.split(/\s+/);
  for (const w of words) {
    const cleanWord = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (cleanWord.length >= 6 && !/[aeiouy]/.test(cleanWord)) {
      return { isValid: false, error: 'masti mat karo yaar.' };
    }
  }

  // Common keyboard mash patterns
  const mashPatterns = [
    'asdf', 'qwerty', 'qwer', 'zxcvb', 'zxcv', 'qwert', 'dfghj', 'hjkl', '12345'
  ];
  for (const mash of mashPatterns) {
    if (norm.compact.includes(mash) && norm.compact.length < mash.length + 5) {
      return { isValid: false, error: 'masti mat karo yaar.' };
    }
  }

  // Exact 2-4 character chunk repeating 2+ times with no spaces (e.g., qwerqwer, abcdabcd)
  if (/^([a-z]{2,4})\1+$/i.test(norm.compact) && norm.compact.length > 5) {
    return { isValid: false, error: 'masti mat karo yaar.' };
  }

  return { isValid: true };
}
