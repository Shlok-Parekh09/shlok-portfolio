// Keep startup failures visible and actionable rather than silently showing black.
(function () {
  const errors = [];
  function report(message) {
    if (!message || errors.includes(message)) return; errors.push(message);
    const show = () => {
      let box = document.getElementById('portfolio-runtime-error');
      if (!box) {
        box = document.createElement('aside'); box.id = 'portfolio-runtime-error'; box.setAttribute('role', 'alert');
        Object.assign(box.style, { position: 'fixed', bottom: '16px', left: '16px', right: '16px', zIndex: '20000', padding: '18px', background: '#131f30', color: '#fff', font: '13px/1.5 monospace', border: '1px solid #91acc5' });
        document.body.append(box);
      }
      box.textContent = 'The scene could not finish loading. Please reload. ' + errors.join(' | ');
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show, { once: true });
  }
  addEventListener('error', e => { if (e.message) report(e.message); });
  addEventListener('unhandledrejection', e => {
    const msg = String(e.reason?.message || e.reason || 'Loading interrupted');
    if (!msg.includes('The play() request was interrupted') && !msg.includes('video-only background media')) report(msg);
  });
})();
