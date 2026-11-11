# The Shirt — A Ronaldo Story

Current delivery: **noise-cleaned v3**, at `out/ronaldo_emotional_v3_clean.mp4`, with a matching preview and source ZIP. Repeating synthetic wind/crowd beds and artificial noise-only swishes are removed. Short ball/footstep/landing sounds remain with a smoother high end. The approved music, narrator, captions, timing and every encoded picture frame are preserved. See [`NOISE_CLEANUP.md`](NOISE_CLEANUP.md) for checks; [`MUSIC_UPDATE.md`](MUSIC_UPDATE.md) and [`QA.md`](QA.md) describe the earlier preserved passes.

Rebuild with `npm run audio:clean`, keeping the previous music-version final and preview in `out/`. This rebuilds only the clean effects bus, renders audio, then copies both picture streams unchanged. Previous files remain `out/ronaldo_emotional_v3_music.mp4`, `out/ronaldo_emotional_v3_music_preview.mp4` and `out/ronaldo_emotional_v3_music_source.zip`.

The 3:20 v3 revision of the original Ronaldo documentary, built in Remotion, React and Three.js. The opening moves from a bicycle-kick impact to Portugal's farewell, then into the child's story within ten seconds. The revised film uses 367 words, purposeful football actions and quiet reaction moments. The farewell concerns international football; his club career continues.

The v3 native final/preview/source remain unchanged at `out/ronaldo_emotional_v3.mp4`, `out/ronaldo_emotional_v3_preview.mp4` and `out/ronaldo_emotional_v3_source.zip`. The original four-minute renders remain unchanged at `out/ronaldo_final.mp4` and `out/ronaldo_preview.mp4`. The original project is preserved in `out/original/ronaldo_source_7bc0685a.zip`. The previous emotional revision remains at `out/ronaldo_emotional_v2.mp4`, `out/ronaldo_emotional_v2_preview.mp4` and `out/ronaldo_emotional_v2_source.zip`; its QA and metadata are backed up in `out/original-v2/`. The earlier London project remains in the parent folder. See [`REVISION.md`](REVISION.md) for the change record.

## Setup

Use Node.js 24 for the native TypeScript cue scripts, Python 3, FFmpeg/ffprobe and Chrome. Only voice synthesis needs the Python `edge-tts` package. Procedural sound generation and mixing use Python's standard library; NumPy and paid services are not required.

Run commands from this folder:

```bash
npm ci
npm run typecheck
npm run validate
npm run review:opening
npm run studio
```

The archive includes the finished voice recordings and measured timing. Rendering can use those files immediately. Run `npm run voice` after editing narration. Voice generation uses `PYTHON` when set, otherwise `/home/natnael/myenv/bin/python` when available, then `python3`. For a fresh Python environment:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/requirements.txt
PYTHON="$PWD/.venv/bin/python" npm run voice
```

The narrator remains `en-GB-RyanNeural`, using native +10% delivery. Each passage is cached by text, voice and rate. Editing a passage regenerates its speech while unchanged passages use their cache. Scene assembly adds the authored silence; speech is never stretched to fill a slot. A passage that overruns its window stops generation and must be shortened or re-timed. To regenerate one scene:

```bash
npm run voice -- --scene scene05
```

## Review and render

Start with the short action reviews, then render the final. The final command also derives a delivery preview without redrawing the 3D film:

```bash
npm run review:opening
npm run review:childhood
npm run review:walking
npm run review:supporting
npm run review:bicycle
npm run review:farewell
npm run stills
npm run render
npm run validate
```

| Command | Output and scope |
| --- | --- |
| `review:opening` | `out/v3_clean-review-opening.mp4`, 00:00–00:10 |
| `review:childhood` | `out/v3_clean-review-childhood.mp4`, 00:10–00:36 |
| `review:bicycle` | `out/v3_clean-review-bicycle.mp4`, 01:42–01:54 |
| `review:walking` | `out/v3_clean-review-walking.mp4`, 00:48–01:02 |
| `review:supporting` | `out/v3_clean-review-supporting.mp4`, 01:28–01:32 |
| `review:farewell` | `out/v3_clean-review-farewell.mp4`, 02:54–03:20 |
| `review:ending` | `out/v3_clean-review-ending.mp4`, 03:04–03:20 |
| `stills` | `out/v3_clean_still_*.png`, selected action and reaction frames |
| `preview` | `out/ronaldo_emotional_v3_clean_preview.mp4`, 960 × 540, 15 fps, 3,000 frames |
| `render` | `out/ronaldo_emotional_v3_clean.mp4`, 1920 × 1080, 30 fps, 6,000 frames |
| `preview:from-final` | Quickly rebuild the 540p preview from an existing final, with identical audio |

Short review videos use 960 × 540 at 30 fps so contact and landing can be checked at the final frame cadence. Both complete targets last 200 seconds. The final is rendered directly from the source at 1920 × 1080 and 30 fps; the 15 fps preview is never an input to the final render. The final encoder uses H.264, CRF 18 and AAC at 192 kb/s. A 2.39:1 cinematic picture sits inside the 16:9 canvas.

`sync-preview-audio` copies the final audio stream into the revised preview without re-encoding its video. Use it for an audio-only update when the picture and timings are unchanged. It records audio provenance in `out/v3_clean_preview_render.json`.

For sound-only revisions, `npm run audio:update` renders the canonical `AudioMix` without constructing any 3D scenes, updates the final and any existing v3 short reviews, verifies that all picture packet hashes remain unchanged, and rebuilds the delivery preview. Run it after the picture export is complete. The resulting audio provenance is recorded in `out/v3_clean_audio_revision.json`. `npm run audio:update -- --master-only` can prepare its cached PCM master separately without modifying videos. `npm run preview` remains available for a direct full-length draft render before the final.

The renderer defaults to `/usr/bin/google-chrome`, one concurrent page and Chromium's `angle` graphics mode. Set `BROWSER_EXECUTABLE`, `RENDER_CONCURRENCY` or `CHROMIUM_GL` for your machine. `CHROMIUM_GL=swangle` is a slower software fallback. Source and asset hashes allow unchanged bundles to be reused. Render manifests are named `out/v3_clean_*_render.json`; current export checks belong in [`QA.md`](QA.md) and `out/v3_clean_validation.json`. The original QA remains preserved in the original source archive.

## Timing and action

| Start | Chapter | Duration |
| --- | --- | --- |
| 00:00 | Kick, Portugal farewell and boot match cut | 10 s |
| 00:10 | Madeira: attempt, mistake and recovery | 26 s |
| 00:36 | Sporting: training with teammates | 20 s |
| 00:56 | Manchester United: decisions and finishing | 36 s |
| 01:32 | Madrid: the cross, bicycle kick and response | 40 s |
| 02:12 | Juventus, United return and Al Nassr | 20 s |
| 02:32 | Portugal: team achievements and farewell | 32 s |
| 03:04 | Shirt, reaction and the child running into light | 16 s |

[`script/script.json`](script/script.json) contains the 367-word narration, native speech passages and their offsets. `scripts/make_voice.py` measures each passage with ffprobe and captures actual Edge TTS `WordBoundary` events. `public/timing.json` stores scene starts, scene-relative word times and explicit `speechRanges`, so silence remains silence for captions and music ducking.

The measured narration ends at 191.856 seconds, leaving 8.144 seconds without voice. Other quiet windows include the child's disappointed reaction, the full bicycle-kick action and the last five seconds of the Portugal chapter. Subtitles use short phrase groups inside safe margins with restrained highlighted words.

Visuals live in `src/scenes/Scene01.tsx` through `Scene08.tsx`. Shared football choreography is in `src/animation/football.ts`; contact cues used by Foley come from the same module. Character pose and expression controls, the camera, stadium and captions are reusable components. Review feet, ball contacts, flight, landing, gaze and reactions after changing choreography. Use `node scripts/check_motion.mjs` for the mathematical contact checks.

The childhood street action is illustrative dramatization. A readable “Dramatized scenes” label appears at 00:25–00:29; its former spoken explanation is removed. The ending cuts to the child by 03:09, when the narration introduces “another child.” Generic training and match staging do not assert undocumented private events. Uniforms have no official crests, logos or sponsors. Number seven represents eras; the Madrid kit represents his Madrid period, while he wore number nine on arrival. Numerical facts retain `VERIFY:` metadata and sources in [`script/facts.md`](script/facts.md).

## Sound and music

The source bank includes original procedural sounds from `scripts/make_sfx.py`. The active clean mix uses only footsteps, touches, kicks and landings. Noise-based ambience, breath, cloth, net, cheer and applause are excluded; a causal 1800 Hz low-pass smooths residual grain in the effects bus only. No external sound recordings or paid sound service were introduced. Their provenance is in `public/sfx/manifest.json` and `public/sfx/CREDITS.txt`.

Before each render, `scripts/make_sound_cues.mjs` reads the shared action timings and `scripts/mix_sfx.py` builds a cached `public/sfx/action_mix.wav`. The generated master is ignored by Git and omitted from the source archive because the renderer rebuilds it. Individual sound assets and generation code remain available. To prepare sound before opening Studio from a fresh source archive:

```bash
node scripts/make_sound_cues.mjs
python3 scripts/mix_sfx.py
npm run studio
```

Regenerate individual procedural sound assets with `python3 scripts/make_sfx.py` when changing their design. Music and Foley reduce under actual speech windows. The crowd drops sharply after the opening impact; the farewell uses a quieter score and deliberate pauses. Review the full audible balance before publishing.

The current score is *Ascension* by Scott Buckley, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Keep the required credit in the upload description:

> 'Ascension' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

Primary license source: [Scott Buckley's Ascension page](https://www.scottbuckley.com.au/library/ascension/). `public/music/bg.mp3` is included. `python3 scripts/make_music.py` can rebuild it from the verified original track, using the checksum-checked composer download. The arrangement selects a continuous 200-second excerpt, gently filters space for narration, normalizes the music source and fades its ending. Playback gain is 0.10 under speech and at most 0.38 between passages, with the existing quieter opening/farewell automation.

## Publishing and version control

[`out/publish.md`](out/publish.md) has revised title options, description, chapter timestamps, tags and thumbnail direction. Before upload, check every `VERIFY:` fact, music license and attribution, the full film for official marks, and narration pronunciation, sound synchronization and caption readability on a phone.

Source changes are saved in focused local commits on `main`. GitHub pushes remain deferred because authentication and the earlier unpushed history have not been resolved. The original history is preserved. Generated MP4s, dependencies, caches, the sound master and secrets stay out of Git.
