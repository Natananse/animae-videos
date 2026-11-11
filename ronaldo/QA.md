# Clear audio and continuous motion delivery — 11 November 2026

The completed v4 exports are `ronaldo_emotional_v4_clear_preview.mp4` (960 × 540), `ronaldo_emotional_v4_clear.mp4` (1920 × 1080) and `ronaldo_emotional_v4_clear_720p.mp4` (1280 × 720). Every file contains 6,000 frames at 30 fps / 200 seconds. All offline checks pass; actual Chrome playback and seeking pass for native and 720p.

The voice is forward and consistent at approximately −17 LUFS programme level with −2.4 dBTP peaks. Music and contact effects are quieter; source narration and word timestamps are unchanged. Actual articulated-pose checks find no held windows, and tracked actor comparisons find no sustained quiet intervals. This specifically covers the freeze symptom missed by earlier framing-only checks.

Native character visibility is 100%, minimum box 12.5299%, maximum connected flat region 20.4789%, and maximum visual keyword delay 32.59 ms. All sentence/year/prize/cast checks pass. 720p is 49 MB with simpler decoding and one-second keyframes. See [`CLEAR_AUDIO_MOTION.md`](CLEAR_AUDIO_MOTION.md), [`out/v4_clear_checks/checks-summary.json`](out/v4_clear_checks/checks-summary.json) and the corresponding browser/playback/audio/framing reports. The browser report records normal cold-start frame drops explicitly; no stalled events or media errors occurred.

Human review remains for preferred voice tone, phone-speaker balance, exact contacts, caption/year-label readability and the existing `VERIFY` facts. Network/device playback cannot be inferred solely from a local Chrome test.

The following records apply to separately preserved earlier exports.

---

# Revision pass 2 delivery checks — 11 November 2026

The native 1080p final completed and passed separately: **6,000/6,000 frames** contain the main character, minimum projected area **12.5658%**, camera height **1.0795–2.5000 m**, maximum connected flat region **20.6516%**, and **zero failures**. All 56 sentences, 19 award events, 21 year cards and supporting-cast checks pass. The maximum delay to the first matching encoded frame is **32.5867 ms**. Both exports pass FFprobe format checks and a complete FFmpeg decode. Final/preview source hashes match. Final render time was 1179.4 seconds; the final is 1920 × 1080, 30 fps, 6,000 frames and 200 seconds.

| Export | Size and rate | Frames | Duration |
| --- | --- | ---: | ---: |
| `ronaldo_emotional_v3_sync2_preview.mp4` | 960 × 540, 15 fps | 3,000 | 200 s |
| `ronaldo_emotional_v3_sync2.mp4` | 1920 × 1080, 30 fps | 6,000 | 200 s |

The native preview passed before the final render. Word timing uses 329 actual native Edge boundaries, 56 sentence cues and 21 year cues. The 19 award reveal/focus events represent 15 physical prizes. Source checks include 383 sentence, cue-boundary and runtime frames; the preview and final audits cover every encoded frame. Full PNGs, actual keyword-frame evidence and stage reports are in `out/checks/`; the final table is [`out/checks/sync-table.md`](out/checks/sync-table.md).

Initial checks caught plain locker walls and missing supporting cast. Modeled locker doors, teammates/opponents and word-timed applause were added; checks were rerun until source, preview and final passed. Existing score, clean sound policy, retained action silence and quiet child ending remain.

Human review remains for pronunciation, subtle foot/ball and hand/trophy contacts, year-label and caption readability on a phone, official marks, music attribution and the dated facts flagged `VERIFY` in [`script/facts.md`](script/facts.md). The 2008 FIFA award-year/January 2009 ceremony distinction and symbolic Madrid number seven remain explicit.

The following record applies to the separately preserved earlier v3 export.

---

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
