# Emotional v3 delivery checks — 11 November 2026

The completed video is `out/ronaldo_emotional_v3.mp4`. Updated source is `out/ronaldo_emotional_v3_source.zip`. Original and v2 versions remain preserved.

| Export | Picture | Frames | Duration | Encoding |
| --- | --- | --- | --- | --- |
| `ronaldo_emotional_v3.mp4` | 1920 × 1080, 30 fps | 6,000 | 200.000 s | H.264; stereo AAC, 48 kHz, 192 kb/s target |
| `ronaldo_emotional_v3_preview.mp4` | 960 × 540, 15 fps | 3,000 | 200.000 s | H.264; identical final AAC stream copied |

The final was rendered directly from the Remotion source at native 1080p/30. It was not made by enlarging or duplicating frames from the reference preview. Its render manifest has no restricted frame range. Rendering used ANGLE and two concurrent pages, taking 1,060.49 seconds (17 minutes 40 seconds). The existing 1024-pixel shadow map and inexpensive procedural assets were retained; no simulation or additional shadow maps were added.

## Rendered review and corrections

Six 960 × 540, 30 fps reviews were rendered and inspected before the complete export: opening (10 s), childhood (26 s), walking (14 s), supporting cast (4 s), bicycle kick (12 s), and farewell/ending (26 s). The corresponding `out/v3_*_contact.jpg` sheets and `out/v3_preflight_review.json` record the review.

Rendered evidence led to corrections for the rigid hip/shorts box, platform soles, post-contact thigh intersection, hair-cap intersections, reversed eyebrow angles, cropped incoming cross, and the post-goal expression reset. These were corrected in geometry, pose, facial controls and framing. The affected bicycle review was rendered again before the full export.

The lead remains number 7. Generic teammates 12 and 6, opponent 4, keeper 1 and supporter 24 have distinct appearances. Adult and child proportions, faces and hairstyles read differently. The goalkeeper makes an attempt while the ball follows the original consistent shot trajectory. No named supporting player is portrayed.

Motion checks passed for the actual rounded boot bounds, stable world-space stance feet, lifted swing feet, exact boot/ball contact, continuous ball travel, landing, net arrival and ball/hand attachment. Keeper checks sampled both variants at 240 Hz, including boot clearance, continuous knees and stable planted feet. Expression transitions and the uninterrupted closing run also pass. `npm run typecheck` passed.

Twenty-one frames from the completed native file were inspected across its beginning, middle and ending, including the problematic boot times, both kick contacts, the cross, keeper, supporting characters, child reveal and closing title. See `out/v3_final_contact.jpg`. No missing or unexpected black frame was observed in these samples. A complete active-picture scan found only the intentional closing fade at 199.900–199.967 seconds.

## Narration, captions and audio

The script has 367 words. Only childhood passage 02-2 was regenerated; all seven other scene MP3/JSON pairs remain unchanged. Ryan retains native +10% delivery without time stretching. The removed spoken staging explanation is replaced by the readable “Dramatized scenes” label around 00:25–00:29, with fuller explanation in the description.

Measured word boundaries and speech ranges drive captions and ducking. The child appears at 189.000 seconds, just before “another” at 189.023 seconds. The last voice ends at 191.856 seconds, leaving 8.144 seconds without narration. Captions were inspected at reduced review size and remain inside safe margins.

Foley uses 428 shared action cues, including the keeper push/landing and re-timed closing footsteps. The measured opening impact peak is at 1.2046875 seconds, 4.687 ms after contact and within one final frame. Video and audio streams both start at zero and last 200 seconds. Finished encoded sample peak: -3.1 dBFS, with no sample clipping. Final and preview have the same AAC packet-stream SHA-256:

```text
d17a53bd32fbfa6b8370b2759531388cca9730e0bcb1ea19ad851c712b3ddbd5
```

Audio synchronization and levels were checked using waveforms, shared cues, speech boundaries, stream timestamps and decoding. Subjective listening was unavailable through this interface; pronunciation and perceptual balance still benefit from a human listen. The character's mouth is an emotional performance, not narration lip-sync.

## Export integrity and source

`npm run validate -- --require-final` passed source invariants, format/frame-count checks, and complete FFmpeg decoding of the final, preview and all six short reviews. The full-picture black scan also decoded the complete video. Machine-readable evidence is in `out/v3_validation.json`, `out/v3_delivery_checks.json`, `out/v3_opening_audio_check.json` and `out/v3_final_scan.log`.

The final bundle fingerprint is `cb7dc07e7b9668bc7e4c943062b258de98fc62e81ff2aae83a34d71c3efdffe3`, matching the corrected bicycle review. Later delivery documentation does not alter that frozen picture source.

File SHA-256:

```text
f52069564b0c847bda109c5e23c41dce27ae9053780d59df13d1cdbaecffba72  ronaldo_emotional_v3.mp4
a169449387222eec2679119eee61c6e4e1d48370186de839f33cb47d3027425b  ronaldo_emotional_v3_preview.mp4
```

All five preservation checks pass: original final/preview, v2 final/preview and v2 source ZIP retain their pre-revision SHA-256 values. The v2 QA and metadata are in `out/original-v2/`; its source archive contains the earlier report. The earlier London project is untouched.

The existing Scott Buckley CC BY 4.0 attribution is retained in `out/publish.md`; sound effects are original procedural assets. Childhood and generic match actions remain identified as dramatization. Career sources remain in `script/facts.md`.

Source changes are committed locally on `main`, with the session list in `out/v3_session_commits.txt`. GitHub pushing remains deferred after the earlier authentication problem and the instruction to continue locally. No history was rewritten. Generated videos, dependencies, caches, large sound masters and secrets are excluded from Git.
