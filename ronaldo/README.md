# The Shirt — A Ronaldo Story

The current source revision is **revision pass 2, `v3_sync2`**: framing cleanup, measured narration cues and visible trophy moments within the existing Remotion, React and Three.js project. The film remains **3:20** with the earlier retention structure, cinematic style, football actions, quiet reactions and child ending. The farewell concerns Portugal international football; the narration says his club career continues. Read the dated evidence and remaining publication checks in [`script/facts.md`](script/facts.md).

The new delivery targets are `out/ronaldo_emotional_v3_sync2_preview.mp4` and `out/ronaldo_emotional_v3_sync2.mp4`. A target filename does not certify a completed render: use the corresponding `out/v3_sync2_*_render.json` manifests, `out/v3_sync2_validation.json` and `out/checks/results.json` to assess the actual exports. [`REVISION_PASS_2.md`](REVISION_PASS_2.md) records this pass's changes and verification workflow.

## Setup

Use Node.js 24, Python 3, FFmpeg/ffprobe, Chrome and a C++17 compiler for the native pixel checker. The existing dependencies and renderer remain in place. Run commands from this folder:

```bash
npm ci
npm run typecheck
npm run validate -- --source-only
npm run studio
```

Finished narration MP3s and measured timing are included. Only narration regeneration needs Edge TTS network access and the Python `edge-tts` package. `npm run voice` uses `PYTHON` when set, otherwise `/home/natnael/myenv/bin/python` when available, then `python3`. To prepare a fresh voice environment:

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
node scripts/check_framing.mjs --capture
npm run preview
node scripts/check_framing.mjs --video=out/ronaldo_emotional_v3_sync2_preview.mp4
npm run render
node scripts/check_framing.mjs --video=out/ronaldo_emotional_v3_sync2.mp4
npm run validate -- --require-final
```

| Artifact | Target and evidence |
| --- | --- |
| Preview | `out/ronaldo_emotional_v3_sync2_preview.mp4`, 960 × 540, 15 fps, 3,000 frames |
| Final | `out/ronaldo_emotional_v3_sync2.mp4`, 1920 × 1080, 30 fps, 6,000 frames |
| Export manifests | `out/v3_sync2_preview_render.json`, `out/v3_sync2_final_render.json` |
| Sentence sync table | `out/checks/sync-table.md` |
| Check frames | `out/checks/`, including FFmpeg-extracted sentence PNGs and `source/` browser frames |
| Automated results | `out/checks/results.json`, `source-audit.json`, render audit NDJSON and flat-region evidence |
| Source/export validation | `out/v3_sync2_validation.json` |

Both complete targets last 200 seconds. The final renders directly from source at 1080p/30 fps; H.264 CRF 18 and AAC 192 kb/s remain the delivery settings. The cinematic 2.39:1 image sits inside the 16:9 canvas. Existing `review:opening`, `review:childhood`, `review:walking`, `review:supporting`, `review:bicycle`, `review:farewell`, `review:ending` and `stills` commands remain available for focused review.

The renderer defaults to `/usr/bin/google-chrome`, one concurrent page and Chromium `angle`. Override with `BROWSER_EXECUTABLE`, `RENDER_CONCURRENCY` or `CHROMIUM_GL`; `swangle` is the software fallback. Source/asset hashes control bundle caching. Source changes after a geometry capture require a new capture before video checks.

## Framing and narration sync

The generated source contains **329 narration words and 329 actual Edge word boundaries**, **56 sentence visual cues**, **21 numeric year-card cues**, and **19 trophy reveal/focus events representing 15 named prizes**. The final narration ends at **191.856 seconds**, leaving the child ending quiet. Authored speech pauses, including the bicycle-kick action window, remain in the 200-second timeline.

[`script/script.json`](script/script.json) gives every sentence a `visual_cue` with `action`, `outfit`, `props`, `camera` and `start_word`. Explicit `year_cues` associate spoken years with numeric cards. [`public/timing.json`](public/timing.json) stores actual scene-relative native word times and speech ranges; [`public/sync.json`](public/sync.json) adds sentence keys, absolute film times, year and trophy events, cumulative counts and voice-file hashes. [`src/animation/sync.ts`](src/animation/sync.ts) exposes those measured cues to the scenes. Written-out year phrases prevent Edge from grouping multiple words into a single timing event.

Character-aware cameras track the animated subject, stay between 0.3 m and 2.5 m high, and aim at the character or sentence subject. The checks measure projected character bounds, the 8% minimum frame area, runtime presence, outfit/action continuity and trophy/year visibility. The flat-region checker scans connected quantized colour regions in the cinematic picture, excluding letterbox bars, and flags regions above 30%. The sync table records sentence, timestamp, expected visual and observed result; inspect its images alongside the numeric checks.

The persistent “Dramatized scenes” badge is removed. The opening instead displays **“Animated tribute, not real footage”** for three seconds, repeated in [`out/publish.md`](out/publish.md). Short chapter/location labels last two seconds and keep the character clear. Uniforms and trophies use generic shapes and palettes without official logos, crests, sponsors or engraved official text.

The 2008 sequence names the Champions League, Premier League, first Ballon d'Or and 2008 FIFA World Player award individually. Later Madrid Champions League years, later Ballon years, Euro 2016 and Nations League 2019/2025 drive measured reveals and a cumulative cabinet. The represented collection contains only prizes named in this narration; it is not an exhaustive career honours total. The four Madrid cups appear when the spoken count reaches four, followed by individual year focus cues.

## Retained sound and staging

The earlier retention pass's opening impact, football choreography, teammates, goalkeeper, supporter response, international farewell and closing child remain the baseline. Shared motion lives in `src/animation/football.ts`; `node scripts/check_motion.mjs` checks its mathematical contacts. Sentence-specific staging updates connect the relevant actions and costume changes to spoken keys.

The approved score remains *Ascension* by Scott Buckley, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Preserve the upload credit:

> 'Ascension' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

The [composer's track page](https://www.scottbuckley.com.au/library/ascension/) is the primary licence reference; local provenance remains in `public/music/`. The arrangement, fades and narration-aware ducking policy remain. Short original ball, touch, footstep and landing effects remain; synthetic hiss beds, noisy wind/crowd, breath, cloth, net and applause layers stay excluded. The renderer rebuilds the cached clean Foley mix before exporting. See [`NOISE_CLEANUP.md`](NOISE_CLEANUP.md) and [`MUSIC_UPDATE.md`](MUSIC_UPDATE.md) for those earlier audio passes.

## Facts and manual review

[`script/facts.md`](script/facts.md) is the primary-source ledger rechecked on **11 November 2026**. `VERIFY:` markers stay in the script and ledger for publication review. Reopen changing retirement/club-status and international-record sources before uploading. Check the distinction between the **2008 award year** and the **January 2009 FIFA World Player ceremony**, Madrid's symbolic number seven versus his arrival number nine, and Madrid's 2018 away match in Turin versus his later Juventus era.

Watch the complete exports for pose/ball/hand contacts, camera clipping, trophy scale and cumulative counts, costume transitions, year-card timing, names and pronunciation, subtitle readability on a phone and audio balance. Confirm all kits and props remain free of official marks. Keep the opening disclaimer, description disclosure and Scott Buckley credit. The full checklist is in [`REVISION_PASS_2.md`](REVISION_PASS_2.md) and [`out/publish.md`](out/publish.md).

## Preserved deliveries and Git

This revision uses new `v3_sync2` filenames. Earlier noise-cleaned v3 (`ronaldo_emotional_v3_clean*`), music v3 (`ronaldo_emotional_v3_music*`), native v3 (`ronaldo_emotional_v3*`), v2 and original four-minute deliveries remain separate. Existing source archives and the earlier London project are preserved. [`REVISION.md`](REVISION.md), [`QA.md`](QA.md) and the audio notes describe those passes.

Local `main` history is preserved. Numbered sections use focused commits; source-only synchronization through the GitHub API is underway on a source branch while retaining the existing history. No force-push is used. Generated MP4s, render caches, dependencies, secrets and the rebuilt Foley master remain outside Git. Check the final handoff for the pushed branch and commit references.
