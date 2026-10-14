// Open the owner's actual HTB profile, rather than a local panel or writeup feed.
export function createHTB(host, config = {}) {
  const link = document.createElement('a');
  link.className = 'htb-launch';
  link.href = config.profile || 'https://profile.hackthebox.com/profile/019e6a96-9db2-712c-94a2-df18d868630a';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.hidden = true;
  link.style.textDecoration = 'none';
  link.setAttribute('aria-label', 'Open my Hack The Box profile (opens in a new tab)');
  const logo = document.createElement('img');
  logo.src = '/logos/hack-the-box.svg';
  logo.alt = 'Hack The Box';
  const label = document.createElement('span');
  label.textContent = 'MY HTB PROFILE ↗';
  link.append(logo, label);
  host.append(link);
  return {
    setVisible(visible) { link.hidden = !visible; },
    dispose() { link.remove(); },
  };
}
