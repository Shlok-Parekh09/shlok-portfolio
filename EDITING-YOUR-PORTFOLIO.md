# Editing Shlok's Portfolio

This is Shlok Parekh's interactive 3D portfolio.

## Run locally

Open a terminal in this folder and run:

```powershell
npm run dev -- --port 3001
```

Open `http://127.0.0.1:3001/`. If the preview is already running, refresh it after content updates. This is a static PlayCanvas export; there is no hot reload or npm installation step.

## The single content file

Edit **`public/portfolio-content.js`**. Keep the surrounding quotes, commas, and brackets. Use `\n` inside a description for a new paragraph. Empty description/link fields are intentionally hidden; they do not display invented copy or nonworking buttons.

### Intro

Edit `intro.title`, `intro.subtitle`, `intro.button`, `intro.orbitalTitle`, and `intro.orbitalSubtitle`. The loader, header, and replay wordmark use a SHLOK vector logo. If you want a different name/logo later, change `window.SHLOK_LOGO_SVG` at the end of the file as well.

### Skills: land and removable server chips

Each object in `skills` controls one map territory and one server module. Edit `title`, `tools`, `description`, and `color`. `map: [x, y]` is its normalized position inside the map overlay (0–1).

```js
{
  id: 'security',
  title: 'Cybersecurity',
  tools: ['Threat hunting', 'SIEM', 'Incident response'],
  description: 'Write what you have learned and how you apply it.',
  color: '#88e1d4',
  map: [0.23, 0.35],
}
```

The current tray is laid out for six modules. Click a chip (or its numbered button) to lift it from its socket. Only then is that module's skill information shown. Click again, use **Return module**, or press Escape to reinsert it. Keep six skills unless you also change the tray layout in `public/portfolio.js`.

### Certificates

The five supplied certificates are displayed as textured, framed 3D objects. Click the selected certificate to open a larger, readable image; **Open original** opens the supplied PDF/JPEG. Use the arrows or left/right keys to browse, and drag the gallery to tilt it.

Edit each certificate's `title`, `issuer`, `date`, and `description`. These are editable descriptions, not verification claims. The e-Raksha entry is participation, not a claimed win.

To replace an existing certificate: place its full-resolution preview in `public/portfolio/certificates/`, its original PDF there too, and update `image`, `original`, and `aspect` (image width ÷ height).

The source PDFs remain in `../certificates/`. `scripts/prepare-certificates.py` can render them again using Python with `pypdfium2`, `pypdf`, and Pillow. It does not edit the certificates themselves.

### Projects

The supplied screenshots are assigned to **SynPhi**, **ANOBIS**, and **The Matrix 26**, based on the names visible in those images. Edit `title`, `category`, `summary`, `description`, `tags`, `url`, and `repository` in each project object.

```js
description: 'What problem did you solve?\nWhat did you build personally?\nWhat was the result?',
url: 'https://your-live-project.example',
repository: 'https://github.com/your-user/your-project',
```

Leave URLs empty until you have real destinations. Screenshots belong in `../projects/`; their matching public paths begin `/portfolio/projects/`. To add another project, add a screenshot there and a corresponding object in `projects`.

### Ending videos

Your two MP4 files appear immediately after the car, replacing the former ending/credits. They play in the listed order and cycle as a playlist; Film 01/02 buttons switch manually. The closing videos are muted so they do not clash with the existing sound control. Scrolling back leaves the ending and pauses them.

Change `ending.title`, `ending.eyebrow`, and `ending.description` for the final copy. Set `ending.email` to your actual address to enable **Get in touch**. Leave it empty to show no contact link.

## Apply content changes

After editing, run:

```powershell
npm run personalize
```

Then refresh the page. This synchronizes the 3D card textures/text, scene attributes, and new certificate/project entries. It regenerates the working scene from `original-export/`, so do not manually edit `public/2509662.json` for permanent changes—put those changes in `scripts/personalize.mjs`.

Runtime-only descriptions update on refresh, but running the command ensures all 3D labels and assets agree with your content file.

## Where the implementation lives

- `public/portfolio-content.js`: your editable content.
- `public/portfolio.js`: click-to-extract chips, the real 3D certificate gallery, project detail dialog, and ending playlist.
- `public/portfolio.css`: layout, colors, and responsive controls.
- `scripts/personalize.mjs`: source-export adaptation, extra server pods, and texture bindings.
- `original-export/`: recoverable unpersonalized runtime/scene snapshot.

The six additional servers reuse the existing three-server pod model, adding one pod at the end of each aisle. The car and original camera path remain.

No automated tests, browser checks, or visual acceptance testing were run for this personalization, as requested. The original site's asset/code provenance remains recorded separately in `asset-provenance.json`; personalizing the visuals does not establish publication rights to third-party assets.
