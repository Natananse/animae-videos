# Background-noise cleanup — 11 November 2026

New final: `out/ronaldo_emotional_v3_clean.mp4`. Preview: `out/ronaldo_emotional_v3_clean_preview.mp4`. Source: `out/ronaldo_emotional_v3_clean_source.zip`.

## Removed noise at its source

The repeating street/stadium beds were generated from filtered noise and looped every eight seconds. In parts of the film they were louder than the approved quiet score. Artificial breath, cloth, cheer, applause and net effects added further noise bursts. These layers are now excluded completely from the effects premix.

The mix retains 416 kick, touch, footstep and landing cues at their existing offsets and gains. Twelve noise-only cues are omitted. Two causal low-pass stages at 1800 Hz soften residual fizzy grain in the effects bus. The existing speech attenuation remains, and headroom gain stays at 1: the quieter cleaned effects are not normalized upward.

Narration and the approved Ascension music source are unchanged and are not passed through this filter. Their gain automation is unchanged.

## Measured reduction

Representative effects-only windows that previously contained hiss now contain exactly zero PCM samples:

| Window | Before, RMS | After |
| --- | --- | --- |
| 3.5–4.2 s | -71.98 dBFS | digital silence |
| 12.2–13.2 s | -36.33 dBFS | digital silence |
| 47.5–48.5 s | -51.93 dBFS | digital silence |
| 173.5–174.1 s | -34.64 dBFS | digital silence |
| 184.5–185.1 s | -36.57 dBFS | digital silence |

These measurements concern the isolated effects track; the final movie still contains its narration and music. Source-layer analysis and technical checks were used, without claiming a subjective listening review.

## Preservation and export

The picture streams are copied directly from the previous music-version files. Both encoded video packet hashes are identical to their inputs, preserving every animation and subtitle frame. No video re-encoding or 3D rendering is performed.

- Final: 1920 × 1080, 30 fps, 6,000 frames, H.264/AAC.
- Preview: 960 × 540, 15 fps, 3,000 frames, H.264/AAC.
- Both: 200 seconds, zero start time, stereo 48 kHz audio.

Every voice MP3/JSON, timing JSON, music MP3/license and `AudioMix.tsx` retains its pre-cleanup hash. The previous music-version final, preview and source ZIP are also unchanged. Only the effects premix changes. Its old copy is preserved in `out/noise-original-v3_music/action_mix.wav` for comparison; original individual sound assets remain available.

The finished encoded mix peaks at −6.0 dBFS, below sample clipping. Final and preview have the same AAC packet-stream hash. Both complete decodes and format/frame-count checks pass through `npm run validate -- --require-final`.

Evidence: `out/v3_clean_noise_reduction.json`, `out/v3_clean_audio_revision.json`, `out/v3_clean_validation.json`, `out/v3_clean_delivery_checks.json` and `out/noise_original_v3_music_checksums.json`.

## Rebuild

With the preserved music-version final and preview in `out/`, run:

```bash
npm run audio:clean
npm run validate -- --require-final
```

The command prepares deterministic cue data, builds the clean effects bus, renders only audio, then remuxes into separate clean filenames. The source archive includes all code, music and original individual sound assets; the generated effects master and rendered videos remain excluded from Git.

The existing music attribution remains in `out/publish.md`. Source changes are committed locally; GitHub pushing is still deferred under the prior instruction. Session commits are listed in `out/v3_clean_session_commits.txt`.
