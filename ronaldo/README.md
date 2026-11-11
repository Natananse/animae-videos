# The Shirt — A Ronaldo Story

The current source revision is **`v4_clear`**: clearer narration, quieter contact sounds, continuous character animation and smoother 30 fps previews within the existing Remotion, React and Three.js project. It preserves revision pass 2's framing, word sync and trophy moments, together with the earlier retention structure, cinematic style and child ending. The film remains **3:20**. The farewell concerns Portugal international football; the narration says his club career continues. Read the dated evidence and publication checks in [`script/facts.md`](script/facts.md).

Completed and checked exports are `out/ronaldo_emotional_v4_clear_preview.mp4`, `out/ronaldo_emotional_v4_clear.mp4` and the smaller `out/ronaldo_emotional_v4_clear_720p.mp4`. All three pass decoding, audio, timing and continuous-motion checks; the native and 720p files also pass actual Chrome playback and seeking. The earlier `v3_sync2` exports and evidence remain preserved. [`CLEAR_AUDIO_MOTION.md`](CLEAR_AUDIO_MOTION.md) explains the new changes and checks; [`REVISION_PASS_2.md`](REVISION_PASS_2.md) records the preceding revision.

## Setup

Use Node.js 24, Python 3, FFmpeg/ffprobe, Chrome and a C++17 compiler for the native pixel checker. The existing dependencies and renderer remain in place. Run commands from this folder:

```bash
npm ci
npm run typecheck
npm run validate -- --source-only
npm run audio:prepare
npm run studio
```

`npm run studio` automatically runs `audio:prepare` through its `prestudio` hook. Preview and final render commands also prepare the cached audio master before bundling. Finished narration MP3s and measured timing are included and remain unchanged in this revision. Only narration regeneration needs Edge TTS network access and the Python `edge-tts` package. `npm run voice` uses `PYTHON` when set, otherwise `/home/natnael/myenv/bin/python` when available, then `python3`. To prepare a fresh voice environment:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/requirements.txt
PYTHON="$PWD/.venv/bin/python" npm run voice
```

The narrator remains `en-GB-RyanNeural` at native +10% delivery. Passage caching preserves unchanged recordings. Speech is never stretched to fit a slot; overruns stop generation. Regenerate a single scene with `npm run voice -- --scene scene04`. After a timing-only cue edit, `python3 scripts/build_sync.py` deterministically rebuilds sync data from the existing captured word boundaries and rejects stale narration.

## Preview first, then final

Capture the source geometry evidence, render and check the 540p preview, fix any failures, then render and check the final:

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

| Artifact | Target and evidence |
| --- | --- |
| Preview target | `out/ronaldo_emotional_v4_clear_preview.mp4`, 960 × 540, **30 fps, 6,000 frames** |
| Final target | `out/ronaldo_emotional_v4_clear.mp4`, 1920 × 1080, 30 fps, 6,000 frames |
| Export manifests | `out/v4_clear_preview_render.json`, `out/v4_clear_final_render.json` |
| Audio master and measurements | `public/audio/clear_master.wav`, `public/audio/clear_master.json`, `out/v4_clear_checks/audio-clarity.json` and `.md` |
| Listening sample | `out/v4_clear_audio_sample.mp3`, 68–83 seconds of the new mix |
| Sentence sync tables and frames | `out/v4_clear_checks/sync-table-preview.md`, `sync-table-final.md`, sentence PNGs and `source/` frames |
| Framing results | `out/v4_clear_checks/results-preview.json`, `results-final.json`, `source-audit.json` and flat-region evidence |
| Playback results | `out/v4_clear_checks/playback-preview.json`, `playback-final.json` and per-frame audit NDJSON |
| Source/export validation | `out/v4_clear_validation.json` |

Both complete targets last 200 seconds. The preview now renders at the same **30 fps** as the final; the old preview's 15 fps limit is removed. Delivery settings are H.264 `yuv420p`, limited-range BT.709, two-second keyframe spacing, fast-start MP4 and stereo 48 kHz AAC at 320 kb/s. The encoder uses CRF 21 / 3 Mb/s maximum for the preview and CRF 18 / 8 Mb/s maximum for the native final. The cinematic 2.39:1 image sits inside the 16:9 canvas. Existing focused review and `stills` commands remain available.

The renderer defaults to `/usr/bin/google-chrome`, one concurrent page and Chromium `angle`. Override with `BROWSER_EXECUTABLE`, `RENDER_CONCURRENCY` or `CHROMIUM_GL`; `swangle` is the software fallback. Source/asset hashes control bundle caching. Source changes after a geometry capture require a new capture before video checks.

## Framing and narration sync

The generated source contains **329 narration words and 329 actual Edge word boundaries**, **56 sentence visual cues**, **21 numeric year-card cues**, and **19 trophy reveal/focus events representing 15 named prizes**. The final narration ends at **191.856 seconds**, leaving the child ending quiet. Authored speech pauses, including the bicycle-kick action window, remain in the 200-second timeline.

[`script/script.json`](script/script.json) gives every sentence a `visual_cue` with `action`, `outfit`, `props`, `camera` and `start_word`. Explicit `year_cues` associate spoken years with numeric cards. [`public/timing.json`](public/timing.json) stores actual scene-relative native word times and speech ranges; [`public/sync.json`](public/sync.json) adds sentence keys, absolute film times, year and trophy events, cumulative counts and voice-file hashes. [`src/animation/sync.ts`](src/animation/sync.ts) exposes those measured cues to the scenes. Written-out year phrases prevent Edge from grouping multiple words into a single timing event.

Character-aware cameras track the animated subject, stay between 0.3 m and 2.5 m high, and aim at the character or sentence subject. The checks measure projected character bounds, the 8% minimum frame area, runtime presence, outfit/action continuity and trophy/year visibility. The flat-region checker scans connected quantized colour regions in the cinematic picture, excluding letterbox bars, and flags regions above 30%. The sync table records sentence, timestamp, expected visual and observed result; inspect its images alongside the numeric checks.

The persistent “Dramatized scenes” badge is removed. The opening instead displays **“Animated tribute, not real footage”** for three seconds, repeated in [`out/publish.md`](out/publish.md). Short chapter/location labels last two seconds and keep the character clear. Uniforms and trophies use generic shapes and palettes without official logos, crests, sponsors or engraved official text.

The 2008 sequence names the Champions League, Premier League, first Ballon d'Or and 2008 FIFA World Player award individually. Later Madrid Champions League years, later Ballon years, Euro 2016 and Nations League 2019/2025 drive measured reveals and a cumulative cabinet. The represented collection contains only prizes named in this narration; it is not an exhaustive career honours total. The four Madrid cups appear when the spoken count reaches four, followed by individual year focus cues.

## Retained sound and staging

The earlier retention pass's opening impact, football choreography, teammates, goalkeeper, supporter response, international farewell and closing child remain the baseline. Shared motion lives in `src/animation/football.ts`; `node scripts/check_motion.mjs` checks its mathematical contacts. Continuous action clocks, natural joint movement, score follow-through and moving trophy cameras address held rigs and repeated pose resets while preserving the spoken cues. `npm run check:motion` checks those paths; the playback check uses actual joint signatures from every rendered frame. Camera movement or animated grain cannot satisfy its articulated-motion check. Grain, blur and vignette strength are reduced for a cleaner picture.

The approved score remains *Ascension* by Scott Buckley, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Preserve the upload credit:

> 'Ascension' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

The [composer's track page](https://www.scottbuckley.com.au/library/ascension/) is the primary licence reference; local provenance remains in `public/music/`. The new offline master keeps the narrator centered, the score stereo and the music lower during speech. Gentle voice EQ and compression improve consistency; quiet contact effects replace the prominent procedural thuds. No heavy noise processing, speech regeneration or time stretching is used. Synthetic hiss beds, noisy wind/crowd, breath, cloth, net and applause layers stay excluded.

The master measures **−16.9 LUFS / −2.4 dBTP**, compared with **−22.53 LUFS** in the previous export. Contact peaks fall from **−7.5 to −25.6 dBTP**; median spoken-word voice-over-music separation is **23.2 dB**. Delivered AAC measurements also pass: native −16.95 LUFS / −2.43 dBTP and 720p −16.96 LUFS / −2.39 dBTP. `npm run audio:prepare` deterministically rebuilds the master when source hashes change. `npm run audio:update` remuxes the current revision's existing exports with AAC 320 kb/s while preserving their picture packets. The legacy `music:remix` script requires explicit inputs and refuses to overwrite existing exports. See [`CLEAR_AUDIO_MOTION.md`](CLEAR_AUDIO_MOTION.md), [`NOISE_CLEANUP.md`](NOISE_CLEANUP.md) and [`MUSIC_UPDATE.md`](MUSIC_UPDATE.md).

## Facts and manual review

[`script/facts.md`](script/facts.md) is the primary-source ledger rechecked on **11 November 2026**. `VERIFY:` markers stay in the script and ledger for publication review. Reopen changing retirement/club-status and international-record sources before uploading. Check the distinction between the **2008 award year** and the **January 2009 FIFA World Player ceremony**, Madrid's symbolic number seven versus his arrival number nine, and Madrid's 2018 away match in Turin versus his later Juventus era.

Watch the complete exports for pose/ball/hand contacts, camera clipping, trophy scale and cumulative counts, costume transitions, year-card timing, names and pronunciation, subtitle readability and audio balance. Audition the new mix on headphones and phone speakers, and play the downloaded MP4 on the phone/player where the earlier video appeared to stick. Check both uninterrupted playback and seeking. Confirm all kits and props remain free of official marks. Keep the opening disclaimer, description disclosure and Scott Buckley credit. The full checklist is in [`CLEAR_AUDIO_MOTION.md`](CLEAR_AUDIO_MOTION.md), [`REVISION_PASS_2.md`](REVISION_PASS_2.md) and [`out/publish.md`](out/publish.md).

## Preserved deliveries and Git

This revision uses new `v4_clear` filenames. The `v3_sync2` revision, earlier noise-cleaned v3 (`ronaldo_emotional_v3_clean*`), music v3 (`ronaldo_emotional_v3_music*`), native v3 (`ronaldo_emotional_v3*`), v2 and original four-minute deliveries remain separate. Existing source archives and the earlier London project are preserved. [`REVISION.md`](REVISION.md), [`QA.md`](QA.md) and the audio notes describe those passes.

Local `main` history and concurrent workspace changes are preserved. Verified source changes follow the existing publication workflow on [`revision-pass-2-source`](https://github.com/Natananse/animae-videos/tree/revision-pass-2-source). No force-push is used. Generated MP4s, audio masters, render caches, dependencies and secrets remain outside Git. Check the final handoff for publication status and commit references.

New source/check archive targets use `out/ronaldo_emotional_v4_clear_source.zip` and `out/ronaldo_emotional_v4_clear_checks.zip`; both are included with this delivery. The current sync evidence belongs in [`out/v4_clear_checks/`](out/v4_clear_checks/); the dated manual `VERIFY` checklist remains in [`script/facts.md`](script/facts.md). Earlier Git delivery is recorded in [`GIT_DELIVERY.md`](GIT_DELIVERY.md).

The complete v4 30 fps preview passes all playback, articulated-motion, audio, framing and sync checks. The native final and smaller 720p playback file have also passed their separate checks. `npm run playback:720` creates `out/ronaldo_emotional_v4_clear_720p.mp4` from the native final; it uses H.264 Baseline and a 2 Mb/s video cap for easier playback. See [CLEAR_AUDIO_MOTION.md](CLEAR_AUDIO_MOTION.md) for the measured comparison and reproduction commands.

For everyday playback, use the **720p file (49 MB)**. It is about 59% smaller than the preceding 119 MB export, with simpler H.264 decoding and one-second seek intervals. Full-quality 1080p remains available. Actual Chrome tests at 0, 75, 160 and 191 seconds showed no media errors, waiting or stalled events. The cold-start software decoder dropped nine frames initially in each test; all later sampled sections had zero drops. Device/network conditions can still affect playback. Final evidence is in [`out/v4_clear_checks/checks-summary.json`](out/v4_clear_checks/checks-summary.json).
