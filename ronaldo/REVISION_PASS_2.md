# Revision pass 2 — framing, voice sync and trophies

This pass edits the existing **The Shirt — A Ronaldo Story** project. It retains Remotion, React, Three.js, the generic kit style, the 200-second retention edit, quiet action windows, the approved music and the clean effects policy. The new export namespace is **`v3_sync2`**. Earlier versions remain available separately.

## Changes

1. **Framing.** Character-aware targets and camera constraints keep the subject intentional across street, pitch, stadium, tunnel and reaction shots. Camera height is constrained to 0.3–2.5 m. The opening carries “Animated tribute, not real footage” for three seconds; the description repeats it. The previous persistent dramatization badge is removed. Short chapter/location labels use two-second windows.
2. **Measured narration sync.** Each script sentence has `visual_cue: {action, outfit, props, camera, start_word}`. Each spoken year has an explicit numeric card cue. Actual Edge word boundaries drive sentence, action, costume, year and trophy timing; synthetic evenly spaced word estimates and tempo fitting are not used. Madeira retains the boy and street/sea setting; Manchester uses red, Madrid white, Juventus black/white, Riyadh yellow/blue, and Portugal red/green.
3. **Trophy moments.** Generic models show the named prize with a flash, camera push and celebration/lift. The cumulative cabinet contains the prizes mentioned so far. Editorial year labels sit beneath models; official marks, sponsors and engraved trophy text are excluded.
4. **Checks.** Render-side projection records test the character's frame area, camera height and visibility. FFmpeg extracts each sentence-key frame. Trophy/year/outfit/action checks produce a table and machine-readable results. A connected-region pixel scan flags flat colour regions above 30% of the cinematic picture.
5. **Git.** Numbered sections use focused commits. Local `main` and earlier history are retained. The numbered sections are published on [`revision-pass-2-source`](https://github.com/Natananse/animae-videos/tree/revision-pass-2-source) through authenticated GitHub API commits with guarded, non-force ref updates. No force-push or MP4 commit is part of the workflow. Final branch/commit references belong in the completed handoff.

## Measured source status

The source validation passed with **329 narration words**, **329 native single-word Edge boundaries**, **56 sentence cues**, **21 year cues**, **19 trophy events** and **15 represented trophies**. The 19 events include four focus cues that add no extra trophy. The film remains **6,000 frames at 30 fps / 200 seconds**. Narration ends at **191.856 seconds**, preserving the quiet ending. `scripts/build_sync.py` regenerates the same sync JSON deterministically from captured data without another synthesis request.

These are source measurements, not a claim that a full video export has passed. Use the completed render manifests, validation report and generated check results for final export status.

| Represented prizes | Count |
| --- | ---: |
| 2008 Champions League, Premier League, Ballon d'Or, FIFA World Player award | 4 |
| Madrid Champions League cups, 2014/2016/2017/2018 | 4 |
| Later Ballon d'Or wins, 2013/2014/2016/2017 | 4 |
| Euro 2016 | 1 |
| Nations League 2019/2025 | 2 |
| Final represented cabinet | **15** |

When the narration says “Four Champions League titles”, four Madrid cups appear together so the picture matches the spoken count. The following year sentences focus those existing cups individually. The cabinet is an account of this film's named prizes; it is not his complete honours list.

## Reproduce and check

Run from `ronaldo/`. Regenerate speech only after changing narration. Native synthesis is cached, fails on an overrun and does not stretch audio. For a cue-only edit, rebuild from existing words with `python3 scripts/build_sync.py`.

```bash
npm run typecheck
npm run validate -- --source-only
node scripts/check_framing.mjs --capture
npm run preview
node scripts/check_framing.mjs --video=out/ronaldo_emotional_v3_sync2_preview.mp4
```

Review the generated table and images, fix failures and repeat the source capture and preview as needed. Only then render the full final:

```bash
npm run render
node scripts/check_framing.mjs --video=out/ronaldo_emotional_v3_sync2.mp4
npm run validate -- --require-final
```

The source capture samples every sentence key, cue boundaries, award reveals and a one-second runtime cadence. The video check additionally consumes the renderer's full-frame geometry audit and scans the video pixels. The flat-region detector uses RGB16 bins and four-neighbour connected regions, excluding cinematic bars. An absent geometry record or stale source fingerprint fails the check rather than silently passing.

| Output | Location |
| --- | --- |
| 540p preview, 15 fps | `out/ronaldo_emotional_v3_sync2_preview.mp4` |
| 1080p final, 30 fps | `out/ronaldo_emotional_v3_sync2.mp4` |
| Render provenance | `out/v3_sync2_preview_render.json`, `out/v3_sync2_final_render.json` |
| Sentence sync table | `out/checks/sync-table.md` |
| Structured results | `out/checks/results.json` |
| Source geometry | `out/checks/source-audit.json` |
| Full export geometry | `out/checks/preview-audit.ndjson`, `out/checks/final-audit.ndjson` |
| Sentence FFmpeg frames | `out/checks/*.png` |
| Source browser frames | `out/checks/source/` |
| Pixel-region evidence | `out/checks/flat-regions.jsonl` and associated check output |
| Export validation | `out/v3_sync2_validation.json` |

The checks enforce projected character area of at least 8% for sentence frames, at least 90% runtime character presence, deliberate short insert limits, 0.3-second cue tolerance, camera height and trophy/year continuity. Read the actual report for observed coverage, region maxima and any remaining failures. Automated projection and pixel checks support visual review; they do not verify historical claims or every perceptual issue.

## Retained staging and sound

The opening impact, child's attempt/mistake/recovery, academy interactions, football action, supporter response, Portugal farewell and closing child remain part of the earlier retention structure. The bicycle kick keeps its authored narration-free action window. Sentence-specific staging changes align spoken actions and kit transitions without rebuilding the project.

The narrator is still `en-GB-RyanNeural` at native +10% speed. *Ascension* by Scott Buckley remains the approved score with the existing arrangement, fades and narration-aware volume policy. The short original ball/footstep/landing effects remain. Synthetic noise beds and excluded noisy ambience/effect layers remain excluded. Keep the existing music and procedural sound provenance files. The required description credit is:

> 'Ascension' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

## Manual VERIFY before publishing

The dated primary evidence is in [`script/facts.md`](script/facts.md), rechecked on **11 November 2026**. `VERIFY:` annotations remain in both that ledger and the script.

- Reopen the retirement announcement, continuing Al Nassr club status and men's international-record source immediately before publication. Distinguish Portugal retirement from retirement from all football.
- Check the 2008 FIFA World Player award-year wording. Its ceremony was in January 2009; it is separate from the 2008 Ballon d'Or.
- Check trophy/year counts: five Champions League cups, five golden balls, one narrated Premier League cup, one World Player award, one Euro cup and two Nations League cups. Only narrated honours belong in the cabinet.
- Check Madrid's symbolic number seven against his arrival number nine. The Madrid bicycle kick is the 2018 away match in Turin; the later Juventus chapter uses black and white.
- Watch every outfit, trophy and environment for official logos, crests, sponsors or accidental branded marks. Generic trophy forms and year overlays must stay legible.
- Review the whole film for camera clipping, subject framing, ball/boot and hand/trophy contacts, believable lifts, expression/gaze, narration pronunciation, exact visual starts, audio balance and phone-size captions.
- Confirm the opening disclosure, repeated description disclosure and Scott Buckley credit in [`out/publish.md`](out/publish.md). Recheck the existing licence record.
- Confirm preview/final dimensions, frame rates, full durations and chapter timestamps against completed exports. Read the generated check table and review its saved frames before uploading.

## Verified preview

The corrected 540p preview completed before the final render. All 3,000 encoded frames passed the geometry and native pixel checks. The main character is visible in 100% of frames, with a minimum projected area of 12.5974%. Camera height is 1.08–2.50 m. The largest connected flat region is 20.5711%, below the 30% limit. All 56 sentences, 19 trophy events, 21 year cards and required supporting actors pass; the maximum measured delay to the first matching encoded frame is 65.92 ms. See `out/checks/results-preview.json` and `out/checks/sync-table-preview.md`.

The native 1080p final completed and passed separately: **6,000/6,000 frames** contain the main character, minimum projected area **12.5658%**, camera height **1.0795–2.5000 m**, maximum connected flat region **20.6516%**, and **zero failures**. All 56 sentences, 19 award events, 21 year cards and supporting-cast checks pass. The maximum delay to the first matching encoded frame is **32.5867 ms**. Both exports pass FFprobe format checks and a complete FFmpeg decode. Final/preview source hashes match. Final render time was 1179.4 seconds; the final is 1920 × 1080, 30 fps, 6,000 frames and 200 seconds.

The completed tables are `out/checks/sync-table.md`, `sync-table-preview.md` and `sync-table-final.md`; machine-readable counts are in `out/checks/checks-summary.json`. Exact native keyword frames remain under `out/checks/preview/` and `out/checks/final/`. See [`GIT_DELIVERY.md`](GIT_DELIVERY.md) for the source-branch workflow.
