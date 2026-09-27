// Original procedural star-flight inspired by the supplied Red Stapler reference.
// No YouTube frame, remote media, additional WebGL context or copied video.
window.createPortfolioWarp = function (wrapper) {
  const canvas = document.createElement('canvas');
  canvas.className = 'sp-warp'; canvas.setAttribute('aria-hidden', 'true'); wrapper.append(canvas);
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stars = Array.from({ length: reduced ? 160 : 680 }, (_, i) => ({ x: Math.sin(i * 127.1) * 1800, y: Math.sin(i * 311.7) * 1800, z: 40 + ((i * 79.9) % 1800), color: i % 7 === 0 ? '#a5dbff' : '#ecf5ff' }));
  let w, h, raf, prev = performance.now();
  const resize = () => { w = innerWidth; h = innerHeight; const ratio = Math.min(devicePixelRatio, 1.5); canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); };
  resize(); window.addEventListener('resize', resize);
  const draw = now => {
    if (!wrapper.isConnected) { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); return; }
    const dt = Math.min((now - prev) / 1000, 0.045); prev = now;
    ctx.fillStyle = '#02050c'; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * .5, h * .5, 0, w * .5, h * .5, w * .5);
    glow.addColorStop(0, '#122032'); glow.addColorStop(1, '#02050c'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    const f = Math.min(w, h) * .65;
    for (const star of stars) {
      const oldZ = star.z;
      if (!reduced && !document.hidden) star.z -= dt * 250;
      if (star.z < 10) star.z = 1800;
      const x = w / 2 + star.x / star.z * f, y = h / 2 + star.y / star.z * f;
      if (x < 0 || y < 0 || x > w || y > h) continue;
      ctx.globalAlpha = Math.min(1, (1800 - star.z) / 1300); ctx.strokeStyle = star.color; ctx.lineWidth = Math.max(.5, 1.8 - star.z / 1300);
      const tailZ = star.z > oldZ ? star.z : star.z + (reduced ? 2 : 25);
      ctx.beginPath(); ctx.moveTo(w / 2 + star.x / tailZ * f, h / 2 + star.y / tailZ * f); ctx.lineTo(x, y); ctx.stroke();
    }
    ctx.globalAlpha = 1; raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
};
