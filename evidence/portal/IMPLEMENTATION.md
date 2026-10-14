# Portal entrance revision

## Scope

Use the user-supplied `h3gwxe2rlp.mp4` as the lunar exterior after the skills/land section. Replace the proposed floating house with a golden spark-ring portal. Reveal the existing live Three.js room through a circular aperture, pass through it, fade a soft white light, and shrink the portal closed from inside. Keep existing projects, certificates, music, and ending unchanged.

## Timeline

- 27.3–28.1%: exterior appears.
- 28.1–30.0%: ring forms and opens onto the live room.
- 30.1–32.0%: aperture expands as the viewer passes through.
- 31.6–33.8%: gentle white light rises and dims.
- 32.0–34.9%: inside-room portal closes; reversing scroll reopens it.
- 34.9–35.9%: unobstructed wide view includes the chess table.
- 35.9–38.5%: existing PC approach resumes.

## Room modifications

The existing mesh is retained. Measured masks remove shelf photo-frame casings in addition to the already omitted photo textures. A TV is mounted in the existing wall-board footprint at world position `[-5.17, 2.92, -1.94]`. No new house or structural doorway is constructed. The TV awaits a permitted user-supplied battle video; it currently displays a clearly labelled placeholder, not fabricated battle footage.

Set `PORTFOLIO_CONTENT.roomTV.src` to a local MP4 path in `public/portfolio-content.js` once supplied. The TV is muted to avoid competing with the music player. Its playback pauses off-screen and when the tab is hidden.

## Verification

Room bundle and JavaScript syntax checked. Targeted tests cover aperture coverage, reverse-deterministic timing, white-light fade, local media, and camera projection of the chess table, PC, TV, and bed at desktop and portrait aspect ratios.

Visual browser verification remains pending: the browser automation connection timed out twice before opening the preview. These numeric checks do not establish final visual approval.
