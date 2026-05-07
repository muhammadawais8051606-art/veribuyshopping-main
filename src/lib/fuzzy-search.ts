/** Small Levenshtein distance for typo-tolerant matching (short strings only). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string) {
  return norm(s).split(" ").filter(Boolean);
}

/** True if query matches text with substring, token overlap, or small edit distance. */
export function fuzzyTextMatch(query: string, text: string): boolean {
  const q = norm(query);
  if (!q) return true;
  const t = norm(text);
  if (!t) return false;
  if (t.includes(q) || q.includes(t)) return true;
  const qt = tokens(query);
  const tt = tokens(text);
  for (const a of qt) {
    if (a.length < 2) continue;
    for (const b of tt) {
      if (b.includes(a) || a.includes(b)) return true;
      if (a.length <= 12 && b.length <= 14 && levenshtein(a, b) <= 2) return true;
    }
  }
  if (q.length <= 14 && t.length <= 40 && levenshtein(q, t.slice(0, 28)) <= 3) return true;
  return false;
}
