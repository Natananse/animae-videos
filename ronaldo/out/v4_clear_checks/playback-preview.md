# Playback and animation checks

File: `out/ronaldo_emotional_v4_clear_preview.mp4`. SHA-256: `9adec5fcd018be6d858a6d6f97eb8842c8fec6859edc4e14e76313dd36be3bbb`.

| Check | Result | Evidence |
| --- | --- | --- |
| constant frame cadence | PASS | 6000/6000 frames, 30 fps; 0 presentation errors, 0 decode-order errors |
| continuous audio timestamps | PASS | 9377 audio packets; 0 gaps or reversals |
| seek interval | PASS | longest keyframe gap 2.000s (limit 2s plus one frame) |
| fast start | PASS | moov 32, mdat 221494 |
| browser compatible encoding | PASS | h264 High level 3.1, yuv420p, tv/bt709, 1.27 Mbps average; aac audio |
| encoded audio clarity levels | PASS | -16.9 LUFS integrated; -2.4 dBTP true peak |
| lead animation continues | PASS | 6000/6000 lead frames have pose signatures; 0 locked 0.75s windows |
| full audio/video decode | PASS | 6000/6000 downscaled frames, 6000/6000 native checksums, decoder exit 0 |
| no decoded image holds | PASS | 0 identical image holds lasting at least 0.5s |

The joint check inspects every overlapping 0.75s window at 0.1s intervals. Its 0.002 radian threshold excludes root movement, breath, camera movement and grain.

## Quiet upper-body intervals for visual review

This pixel test is advisory: a slow expression can be intentional. It compares smoothed, tracked character crops 0.5s apart, independently of the exact decoded-image and joint tests.

No intervals meet the quiet-crop threshold.
