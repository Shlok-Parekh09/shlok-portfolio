const fs = require('fs');

let css = fs.readFileSync('public/portfolio.css', 'utf8');
css = css.replace('.sp-room-caption { bottom: 14vh; left: 6vw; max-width: 88vw; }', '.sp-room-caption { top: 12vh; right: 6vw; left: auto; bottom: auto; max-width: 80vw; text-align: right; }');
css = css.replace('.sp-room-caption p { font-size: 10px; }', '.sp-room-caption p { font-size: 10px; margin-left: auto; }');
fs.writeFileSync('public/portfolio.css', css);

let js = fs.readFileSync('public/portfolio.js', 'utf8');
js = js.replace('align-items:flex-start !important', 'align-items:center !important');
js = js.replace('<div style=\"position:absolute; z-index:10; width:32px; height:32px; background:#fff; border:4px solid #a1a1aa; border-radius:50%; top:48px; left:48px; box-shadow:0 1px 3px rgba(0,0,0,.1);\"></div>', '<div class=\"disc-center\" style=\"position:absolute; z-index:10; background:#fff; border:4px solid #a1a1aa; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,.1);\"></div>');
js = js.replace('.sp-player .song-item .si-artist { font-size:12px; color:#71717a; }', '.sp-player .song-item .si-artist { font-size:12px; color:#71717a; }\\n    .sp-player .disc-center { width:32px; height:32px; top:48px; left:48px; }');
fs.writeFileSync('public/portfolio.js', js);
console.log('Fixed CSS and JS');
