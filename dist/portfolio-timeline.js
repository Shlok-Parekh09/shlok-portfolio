// Deterministic math shared by the browser and timeline tests.
(function (root) {
  const clamp = v => Math.min(1, Math.max(0, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const range = (p, a, b) => clamp((p - a) / (b - a));
  root.PortfolioTimeline = {
    clamp, smooth, range,
    certificate(p, count) {
      const sequence = range(p, .385, .545) * (count - 1);
      const index = Math.floor(sequence);
      const slide = smooth(range(sequence - index, .55, 1));
      return { index: Math.min(count - 1, index + (slide > .5 ? 1 : 0)), slide, dissolve: smooth(range(p, .550, .566)) };
    },
    iris(p) {
      return { reveal: smooth(range(p, .704, .712)), color: smooth(range(p, .705, .714)) };
    },
  };
})(typeof window === 'undefined' ? globalThis : window);
