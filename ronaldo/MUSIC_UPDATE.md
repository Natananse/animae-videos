# Music-only v3 update — 11 November 2026

The new delivery is `out/ronaldo_emotional_v3_music.mp4`; its smaller preview is `out/ronaldo_emotional_v3_music_preview.mp4`. Both last 200 seconds. Updated source is `out/ronaldo_emotional_v3_music_source.zip`.

Only the background score and its playback gain change. *Ascension* by Scott Buckley replaces *Sanctuary*, using a continuous 50–250 second excerpt. The new orchestral/synth score has a stronger dramatic build, gentle bass/midrange filtering for narration space, and a soft six-second ending fade. The composer permits its use under CC BY 4.0 with attribution: https://www.scottbuckley.com.au/library/ascension/

Required upload-description credit, also saved in `out/publish.md` and `public/music/CREDITS.txt`:

> 'Ascension' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

## Narration remains the focus

Playback gain reduces to 0.10 under actual measured speech windows and reaches at most 0.38 in gaps, with the existing quieter opening/farewell automation. During the authored speech ranges, the decoded sources and actual gain curve measure narration at -22.32 dBFS RMS and music at -41.43 dBFS RMS: the score averages **19.1 dB below the voice**.

The finished AAC mix peaks at −4.2 dBFS, below sample clipping. Final and preview contain identical AAC packets. These are technical level, timing and decoding checks; subjective listening is not claimed.

## Picture and dry audio are preserved

`npm run music:remix` renders the existing `RonaldoAudio` composition alone, then copies the old v3 picture streams into separately named MP4 files. It never runs a 3D frame render, video encoder, scale filter or frame-rate conversion. The preview picture is also copied directly from its original.

Both encoded video-packet hashes match their original files exactly:

```text
7d11abf4a12ea3221eaae01c742a6dbd3da59cfa3f942ed9268e518506f0148f  final picture
071685a1be0904f7aca4ae6fac750f21199d5e14d5b086d55b7ab77768eb83df  preview picture
```

The final retains 1920 × 1080, 30 fps and all 6,000 frames; the preview retains 960 × 540, 15 fps and all 3,000 frames. Both use H.264 with stereo 48 kHz AAC. Both streams start at zero, and the duration remains 200 seconds. Therefore the previously verified visuals, captions and scene timing are unchanged.

Every voice MP3/JSON, `public/timing.json` and the action-sound master remain hash-identical. Their gains and offsets are unchanged. Foley and narration were not regenerated. The old v3 final, preview and source ZIP also retain their original file hashes. Their metadata and QA are backed up in `out/music-original-v3/`.

`npm run typecheck` and `npm run validate -- --require-final` pass. Both new files decode completely without errors. Evidence is in `out/v3_music_audio_revision.json`, `out/v3_music_balance_check.json`, `out/v3_music_validation.json` and `out/v3_music_delivery_checks.json`. The original native-picture review remains in `QA.md`.

## Rebuild

Keep the preserved v3 final and preview in `out/`, then run:

```bash
npm run music:remix
npm run validate -- --require-final
```

The source package includes the prepared score, existing voice recordings and individual Foley assets. Its large generated action-sound master is omitted; on a fresh extraction, rebuild it with `node scripts/make_sound_cues.mjs` followed by `python3 scripts/mix_sfx.py`. The score can be rebuilt with `python3 scripts/make_music.py`, which verifies the composer download checksum. No paid service is used.

Source changes are saved in focused local commits. GitHub pushing remains deferred after the earlier authentication issue and instruction to continue locally. Session history is `out/v3_music_session_commits.txt`.
