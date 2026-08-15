/*
 * mulberry32, deterministic on purpose. the forms are art-directed, and both the
 * structure and the per-particle variation have to come back identically on every
 * reload. decorative only, never used for anything security related.
 */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
