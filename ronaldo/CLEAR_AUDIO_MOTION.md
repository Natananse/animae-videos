# Clear sound and continuous motion — v4_clear

This revision edits the existing 200-second Remotion, React and Three.js film.
It keeps the previous retention work, native word timestamps, sentence cues,
generic kits, trophy collection, opening disclosure and factual `VERIFY` notes.
All earlier source and rendered deliveries remain separate.

The audio master, complete 30 fps preview, native final and 720p playback export
have passed their checks. Actual Chrome playback and seeking also pass for the
native and 720p files. This document records the verified exports and workflow.

## What caused the unclear sound and held-looking picture

The previous final had valid video presentation timestamps and continuous AAC
audio packets. Its 6,000 frames formed a 30 fps, 200-second file, and the audio
and video decoded without errors. Valid timestamps did not establish that the
characters were moving: several action clocks reached a clamp or reset on a
sentence change, reaction rigs held poses, and trophy camera pushes settled.
The previous 540p preview also ran at 15 fps, making motion less smooth.

The previous mix measured −22.53 LUFS overall. The narration was quiet, while
isolated procedural contact effects reached −7.5 dBTP and competed with words.
The cached narrator recordings have clean pauses, so heavy noise reduction
would address the wrong problem.

## Audio changes and measured checks

`scripts/prepare_clear_audio.py` builds `public/audio/clear_master.wav`, a
24-bit stereo 48 kHz master containing exactly 9,600,000 samples / 200 seconds.
`AudioMix.tsx` plays that single master, giving preview, final and review clips
the same mix independently of video frame rate. The source MP3s, word-boundary
JSON files, timing and licensed score remain unchanged.

The narrator stays centered. A 75 Hz high-pass, gentle −1.5 dB low-mid cut,
+1.5 dB presence adjustment, mild 2.1:1 compression and fixed gain make the voice
more consistent. Latency-compensated peak limiting preserves its place in the
edit. The stereo score drops smoothly during speech; gain is interpolated at
the audio sample rate between 5 ms control points. Footstep, touch, kick and
landing sounds keep their contact times at much quieter levels. No heavy
denoising, synthetic ambience bed, voice regeneration or time stretching is
used.

| Measurement | Previous export or bus | New master or bus |
| --- | ---: | ---: |
| Overall integrated loudness | −22.53 LUFS | −16.9 LUFS |
| Master true peak | −6.7 dBTP | −2.4 dBTP |
| Centered narrator loudness | — | −16.5 LUFS |
| Contact effects true peak | −7.5 dBTP | −25.6 dBTP |
| Median spoken-word voice over music | — | 23.2 dB |
| 10th-percentile spoken-word voice over music | — | 18.0 dB |
| Maximum measured passage-onset difference | — | 10 ms |

The preparation checks verify stereo format, exact duration, loudness, peak
headroom, voice/music separation, quiet contacts, preserved onsets and unchanged
source hashes. Details are in `out/v4_clear_checks/audio-clarity.json` and its
human-readable `.md` companion. `public/audio/clear_master.json` records source
hashes and settings. These master measurements must be distinguished from the
final AAC stream, which needs its own decode, timing and peak checks.

The 15-second `out/v4_clear_audio_sample.mp3` covers 68–83 seconds of the new mix
at 320 kb/s for quick listening. Preserve the score credit in the video upload:

> 'Ascension' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

## Motion and image changes

Continuous action clocks carry motion across consecutive sentence cues.
Scoring actions continue through follow-through and recovery; reactions include
natural articulated movement; trophy lifting, celebratory poses and trophy
cameras keep moving after the reveal. The changes preserve the narration's
action, outfit, prize count and year cues. They do not use camera motion or film
grain as evidence that a character is animated.

The render-side audit records actual root and joint coordinates. The playback
checker measures articulated-joint movement in overlapping 0.75-second windows,
excluding root sliding, breathing, film grain, lighting and camera movement.
Its 0.002-radian threshold catches held rigs. Decoded frame checks separately
look for identical image holds and decoding failures. The continuous-motion
source checker also verifies choreography and trophy-hand attachment.

Grain, blur and vignette strength are reduced for a cleaner image. The 540p
preview now runs at **30 fps / 6,000 frames**, matching the final's cadence.
The final remains a native 1920 × 1080 source render at 30 fps.

Both targets use H.264 `yuv420p`, limited-range BT.709, two-second keyframe
spacing and fast-start MP4. The preview's encoder maximum is 3 Mb/s; the final's
is 8 Mb/s. Stereo AAC uses 48 kHz at 320 kb/s. These settings reduce the work
required for browser/phone playback and seeking; device playback still needs a
manual check.

## Render and check workflow

Run commands from the project folder. `npm run studio` prepares the master
automatically through `prestudio`; preview and final renders also prepare it.
The cache is invalidated by changes to narration, timing, cues, score or the
preparation script.

```bash
npm run typecheck
npm run validate -- --source-only
npm run audio:prepare
npm run check:motion
node scripts/check_framing.mjs --capture
npm run preview
node scripts/check_framing.mjs --video=out/ronaldo_emotional_v4_clear_preview.mp4
npm run check:playback -- --video=out/ronaldo_emotional_v4_clear_preview.mp4 --audit=out/v4_clear_checks/preview-audit.ndjson --output=out/v4_clear_checks/playback-preview.json
npm run render
node scripts/check_framing.mjs --video=out/ronaldo_emotional_v4_clear.mp4
npm run check:playback -- --video=out/ronaldo_emotional_v4_clear.mp4 --audit=out/v4_clear_checks/final-audit.ndjson --output=out/v4_clear_checks/playback-final.json
npm run validate -- --require-final
```

Fix preview failures before rendering the final. Recheck the actual AAC stream's
LUFS, true peak, start time and duration after encoding. Do not apply the old
15 fps preview assumptions to the new files.

| Evidence | Current target |
| --- | --- |
| Preview and final | `out/ronaldo_emotional_v4_clear_preview.mp4`, `out/ronaldo_emotional_v4_clear.mp4` |
| Render manifests | `out/v4_clear_preview_render.json`, `out/v4_clear_final_render.json` |
| Audio measurements | `out/v4_clear_checks/audio-clarity.json`, `audio-clarity.md` |
| Full frame audits | `out/v4_clear_checks/preview-audit.ndjson`, `final-audit.ndjson` |
| Playback/decode/cadence/pose checks | `out/v4_clear_checks/playback-preview.json`, `playback-final.json` |
| Framing, flat regions and cue checks | `out/v4_clear_checks/results-preview.json`, `results-final.json` |
| Sentence sync tables | `out/v4_clear_checks/sync-table-preview.md`, `sync-table-final.md` |
| Check frames | `out/v4_clear_checks/`, including sentence PNGs and `source/` frames |
| Source/export validation | `out/v4_clear_validation.json` |

`npm run audio:update` refreshes audio in current revision exports while copying
their encoded picture packets. It prepares the same clear master and encodes
AAC at 320 kb/s. `audio:clean` uses that current workflow. The legacy
`music:remix` helper requires explicit source filenames and refuses existing
outputs, preventing an older picture from replacing a new export by default.

## Manual review and delivery

Listen on headphones and phone speakers for voice tone, sibilance, quiet words,
music balance and contact sounds. Watch the downloaded preview and final in the
phone/player where playback previously stuck. Check continuous playback,
seeking and transitions, including quiet reactions and trophy sequences.
Inspect face/hand/ball contact, camera clipping, costume changes, trophy counts,
year cards and subtitle readability. Numerical movement checks cannot establish
that every gesture looks natural.

The existing `VERIFY` items in `script/facts.md` remain publication checks:
changing retirement/club status and record claims; the 2008 award year versus
the 2009 FIFA ceremony; Madrid's arrival shirt number; and the Turin match's
era. This pass changes no narration facts. Keep generic kits and trophies free
of official marks, retain the opening disclaimer and repeat it with the music
credit in `out/publish.md`.

All previous exports, voice sources and legacy source history are preserved.
After the new checks finish, source publication uses the existing
`revision-pass-2-source` branch without force-pushing. Generated videos and audio
masters stay outside Git. New archive targets use
`out/ronaldo_emotional_v4_clear_source.zip` and
`out/ronaldo_emotional_v4_clear_checks.zip`; the final handoff records which
artifacts and checks actually completed.

## Verified full preview

The complete 960 × 540 preview contains 6,000 independently rendered frames at 30 fps. All nine playback checks pass: continuous presentation/audio timestamps, short seek interval, front-loaded MP4 index, BT.709 limited-range H.264, complete native decode, no repeated image holds, no locked articulated-pose windows and encoded audio clarity levels. All 6,000 lead frames have joint signatures; the minimum articulated range over a 0.75-second window is 0.011679 radians, above the 0.002 gate. The tracked actor scan finds zero sustained quiet intervals, compared with six in the previous final.

Framing and speech sync also pass: the character appears in all 6,000 frames, minimum projected area 12.5299%, largest connected flat region 20.4398%, all 56 sentences, 19 prize events and 21 year cards correct. Maximum keyword-frame delay is 32.59 ms. The encoded preview measures −16.9 LUFS and −2.4 dBTP. Reports and the 56 extracted sentence frames are in `out/v4_clear_checks/`.

## Smaller playback delivery

`npm run playback:720` derives `out/ronaldo_emotional_v4_clear_720p.mp4` from the completed native 1080p final. It retains all 6,000 frames at 30 fps while using 1280 × 720, H.264 Baseline level 3.1, no B-frames, a 2 Mb/s video cap, one-second keyframes, AAC 192 kb/s from the original clear PCM master, and fast-start MP4. It reduces file size and decoding/seek demands for the reported playback stalls. The native 1080p version remains available. Actual device/network playback still deserves a phone check.

Run its delivered-file check after creation:

```bash
npm run playback:720
node scripts/check_playback.mjs --video=out/ronaldo_emotional_v4_clear_720p.mp4 --audit=out/v4_clear_checks/final-audit.ndjson --audio-levels --output=out/v4_clear_checks/playback-720p.json
```

## Completed final and browser checks

All 6,000 native frames pass framing and native-pixel checks. The lead is visible in 100% of frames; minimum projected box area is 12.5299%, maximum flat region 20.4789%, and maximum keyword-frame delay 32.5867 ms. All 56 sentence cues, 19 award events and 21 year cards match. Native and 720p each pass all nine playback checks: every decoded frame is unique, no locked articulated-pose windows, no quiet tracked-actor intervals, continuous timestamps and complete decode. Native AAC is −16.95 LUFS / −2.43 dBTP; 720p AAC is −16.96 LUFS / −2.39 dBTP.

The 720p file is **49,003,334 bytes**, about 59% smaller than the preceding 118,975,257-byte export. Its measured video rate is 1.755 Mb/s average; 2 Mb/s maxrate and a 4 Mb VBV buffer are encoder settings, not a promise of an identical instantaneous network rate.

Actual muted HTML5 playback via a local HTTP byte-range server passed in installed Chrome at 0, 75, 160 and 191 seconds for both files. There were no media errors, waiting or stalled events. The cold software-decoder startup recorded nine dropped frames in each first sample; all later samples had zero drops. The longest displayed-frame gap was 179 ms, below the 0.5-second hold threshold. 720p seeking recovered in 25–55 ms. Local testing verifies decoding and seeking; it does not reproduce the viewer's internet connection or phone.

Run browser tests after rendering/transcoding has stopped:

```bash
npm run check:browser -- --video=out/ronaldo_emotional_v4_clear_720p.mp4 --output=out/v4_clear_checks/browser-720p.json
```

The source and check archives contain the implementation and evidence, without generated WAV masters or MP4s in Git. The previous revision remains preserved.
