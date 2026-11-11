# Movement and character revision — v3

This pass preserves the 200-second emotional-v2 structure and addresses the visible rig, foot, cast and performance problems in its preview. The final is rendered directly from the source at 1920 × 1080, 30 fps; no preview upscaling or duplicated preview frames are used.

## Preserved versions

The original four-minute final and preview remain `out/ronaldo_final.mp4` and `out/ronaldo_preview.mp4`, with source in `out/original/ronaldo_source_7bc0685a.zip`. Emotional v2 remains `out/ronaldo_emotional_v2.mp4`, `out/ronaldo_emotional_v2_preview.mp4` and `out/ronaldo_emotional_v2_source.zip`. Its QA and metadata are copied to `out/original-v2/`. The checksum inventory before v3 changes is `out/v3_preserved_versions.json`. Git history retains both earlier source versions.

## Clothing, feet and identity

The inverted kick exposed a rigid box-shaped pelvis while its bare thighs rotated independently. Rounded hip geometry and shorts attached to each thigh replace that box. The shirt hem is rounded rather than a flat cylinder and projecting trim. The follow-through also moves the kicking thigh clear of the torso after contact. These changes correct the geometry and pose rather than concealing them with a cut.

Separate pale rectangular sole plates are replaced by thin, rounded dark soles integrated into the boots. Sole bottom and striking-toe coordinates stay consistent with the kinematics. Existing world-locked stance feet, lifted swing feet, body travel and ball-contact frames are retained and checked.

The child has a smaller body, rounder head, softer cheeks, smaller nose and curled hair. Adult Ronaldo has a defined jaw, smaller eyes and a swept hairstyle. The same lead identity continues across kit changes. Generic teammates, opponents, a goalkeeper and the featured supporter use different numbers, hair, faces, skin tones and builds, reusing the base rig. They do not represent named real players.

## Performance and staging

Expressions blend through brow, eyelid and mouth shapes, with coordinated head, gaze and shoulder changes. Childhood frustration develops into determination and relief; achievement reactions soften into pride. Farewell shots retain sadness while allowing a small amount of pride. Hair caps follow each head profile, avoiding scalp intersections. Rendered review also corrected the eyebrow angles so concentration and sadness read as intended. The mouth expresses emotion and never follows narration as dialogue.

A generic goalkeeper reads and attempts to stop the featured shot. His staging uses the same sampled ball play, preserving its contact frame, direction and outcome. The preparation camera keeps the incoming cross inside the letterbox, and the following close-up continues from the player's smile into relief. Gentle camera-side fill lights make close-up faces readable; they add no shadow maps or simulation. The existing 1024-pixel shadow map remains in use.

## Narration and ending

Only childhood passage 02-2 was regenerated, retaining Ryan at native +10% delivery without stretching. The spoken street-is-imagined sentence is removed. A readable “Dramatized scenes” label appears around 00:25–00:29; the accompanying description explains the dramatization. Narration is now 367 words. Measured captions and speech ranges are updated; the other seven scene recordings remain unchanged.

The closing child appears at 189.0 seconds, just before the measured “another” onset at 189.023 seconds. Pickup and the run into light begin two seconds earlier; closing footsteps follow the changed action clock. The shirt, adult reaction, quiet final title and total 200-second duration remain. The last voice still ends at 191.856 seconds.

## Review and delivery

Review clips use 960 × 540 at 30 fps, with separate v3 filenames:

- Opening: `out/v3-review-opening.mp4`, 00:00–00:10.
- Childhood and label: `out/v3-review-childhood.mp4`, 00:10–00:36.
- Walking and soles: `out/v3-review-walking.mp4`, 00:48–01:02.
- Supporting characters: `out/v3-review-supporting.mp4`, 01:28–01:32.
- Bicycle kick and goalkeeper: `out/v3-review-bicycle.mp4`, 01:42–01:54.
- Farewell and ending: `out/v3-review-farewell.mp4`, 02:54–03:20.

The full delivery is `out/ronaldo_emotional_v3.mp4`, H.264 with AAC audio. The smaller full-length preview is `out/ronaldo_emotional_v3_preview.mp4`; it is derived from the finished final to avoid redrawing the film. Updated source is delivered as `out/ronaldo_emotional_v3_source.zip`.

Completed export evidence belongs in `QA.md` and `out/v3_validation.json`. This change record describes implementation; it does not substitute for rendered-frame inspection and final output checks. Source changes are committed in focused local commits. GitHub pushing remains deferred following the earlier authentication problem and the instruction to continue locally. No history is rewritten; generated videos and large sound masters stay out of Git.

## Music-only update

The next delivery changes only the background score to *Ascension* by Scott Buckley (CC BY 4.0), using a driving cinematic excerpt at restrained volume. The preserved v3 final and preview supply their original encoded picture streams; no animation or caption frames are rendered again. Voice recordings, timings and Foley remain unchanged. The new outputs are `out/ronaldo_emotional_v3_music.mp4`, `out/ronaldo_emotional_v3_music_preview.mp4` and `out/ronaldo_emotional_v3_music_source.zip`. `npm run music:remix` rebuilds the audio and verifies both picture packet hashes. See `MUSIC_UPDATE.md` for measured delivery results and the updated attribution in `out/publish.md`.

## Noise cleanup

The clean variant removes the synthetic street/stadium loops and all noise-only effects, retaining essential contact sounds with a gentle effects-only low-pass. Music, narration and picture streams are preserved. New outputs use `ronaldo_emotional_v3_clean` names; `npm run audio:clean` rebuilds the effects bus and performs an audio-only export from the preserved music version. See `NOISE_CLEANUP.md`.
