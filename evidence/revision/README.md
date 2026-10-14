# Portfolio revision — 30 September 2026

## Current intent (supersedes the abandoned black-hole entrance)

Preserve the original PlayCanvas DiamondMover, CameraController, scrolling and
landing timing. Import the user's `diamond satellite.blend` geometry below the
same animated DiamondV4 parent. Latest correction preserves the original terrain
entirely. Skills use dark navy text and light frosted panels for contrast. The
white diamond face is turned toward the existing camera.

The original land now crossfades directly into the room. No entry video, amber ring,
black-hole zoom, white flash or black-screen interval is part of this sequence.
The final contact-page black-hole still remains, as requested previously.

The PC screen transitions to blue procedural time travel while the camera
approaches it. The gold Chipcard and legacy server/car/chip geometry are removed
from active scene components. Certificate cards are approximately 15% smaller.

## Interactions and media

- Ten local tracks; Honeypie by JAWNY is first/default.
- Laptop click focuses its actual 3D screen and suspends the global ScrollManager.
  Wheel or touch scrolling offsets the Spotify-style canvas list; UV picking
  includes that offset and the texture rotation. No separate dialog/list is
  created. Click outside, Escape, or the screen's back control resumes the room.
- The existing desktop player appearance/list is retained. Mobile hides its
  separate list and keeps playback buttons plus the interactive 3D laptop.
- Selecting a track calls audio.play within its input gesture. Audio events
  drive the Pikachu mixer; pause/buffering/Namo Namo stop the dance.
- Pikachu: user-provided FBX converted with its 144 animation channels and four
  embedded textures. Mounted beside the measured desktop cups at [3.94,1.995,2.70],
  not on the rack. Height is 0.52 room units.
- Ash x Alain: supplied MP4, muted on the room TV to avoid competing audio.
- Interstellar target volume changed from 0.20 to 0.72.

## Loading and safe cleanup

Artificial load hold removed; bands reduced to 500ms. Initial shader warm-up
only traverses the initial satellite/diamond scenes, with a 120ms settle.
Custom room is deferred until progress 0.08; ending media uses preload none.
Legacy model/material dependencies excluded from startup total about 20 MB
across the two optimization passes. Tailwind CDN removed (no utility usage).
Original source .blend files, user songs, certificates and project originals
are preserved. Superseded lunar/portal output assets and obsolete portal code
are removed separately with workspace-bounded targets.

## Evidence and limitations

`node --test tests/revision.test.mjs`: seven tests passed before cleanup.
JavaScript syntax checks and esbuild room bundle passed.
Model inspection confirms packed textures and Pikachu animation channels.
These are static/local checks, not browser visual acceptance or a performance
benchmark. Browser verification was blocked by the approval service's
out-of-credits error. No alternate browser mechanism was used to bypass it.
Final model framing, TV playback, phone layout and input require visual review.
