/*
 * mulberry32, deterministic on purpose. everything the field's look depends on is
 * art-directed, so the same structure and the same per-particle variation have to come
 * back on every reload. decorative only, never used for anything security related.
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
