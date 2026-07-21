// ─────────────────────────────────────────────────────────────────────────────
// Small, dependency-free fuzzy substring match. Lets search tolerate typos
// ("claddng" → "cladding") without pulling in a search library — composes
// directly with hand-built weighted scoring (see TradeDeskTab.tsx).
// ─────────────────────────────────────────────────────────────────────────────

// Bounded Levenshtein distance: returns true iff edit distance between a and
// b is <= maxDist. Early-exits whole rows once every cell in them exceeds
// maxDist, so it stays cheap even run per-token per-field per-item.
function levenshteinWithin(a: string, b: string, maxDist: number): boolean {
  if (Math.abs(a.length - b.length) > maxDist) return false
  if (a === b) return true

  let prev = new Array(b.length + 1)
  let curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    let rowMin = curr[0]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      if (curr[j] < rowMin) rowMin = curr[j]
    }
    if (rowMin > maxDist) return false
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length] <= maxDist
}

// Distance tolerance scales with word length: short words need an exact/
// prefix match (a 1-typo tolerance on "BAL" would match too much unrelated
// noise), longer words can tolerate more.
function toleranceFor(term: string): number {
  if (term.length <= 3) return 0
  if (term.length <= 6) return 1
  return 2
}

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

/**
 * True if `term` appears verbatim in `haystack` (fast path), or if any
 * whitespace/punctuation-delimited token in `haystack` is within fuzzy
 * edit-distance tolerance of `term`.
 */
export function fuzzyIncludes(haystack: string, term: string): boolean {
  const h = haystack.toLowerCase()
  const t = term.toLowerCase().trim()
  if (!t) return false
  if (h.includes(t)) return true

  const maxDist = toleranceFor(t)
  if (maxDist === 0) return false

  for (const token of tokenize(h)) {
    if (Math.abs(token.length - t.length) > maxDist) continue
    if (levenshteinWithin(token, t, maxDist)) return true
  }
  return false
}
