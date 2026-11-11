# Browser playback smoke test

File: `out/ronaldo_emotional_v4_clear_720p.mp4`. Overall: **PASS**.

| Position | Playback advance | Displayed frames | Longest frame gap | Seek | Result |
| --- | --- | --- | --- | --- | --- |
| 0s | 3.469s / 3.509s | 93 | 0.179s | 0.0ms | PASS |
| 75s | 3.470s / 3.510s | 104 | 0.050s | 48.5ms | PASS |
| 160s | 3.471s / 3.511s | 104 | 0.052s | 54.6ms | PASS |
| 191s | 3.468s / 3.509s | 104 | 0.061s | 24.9ms | PASS |

Actual muted HTML5 playback and seeking in installed headless Chrome, via local HTTP byte ranges, after rendering/transcoding stopped. Local playback verifies decoding and seeking; it does not measure the viewer’s internet connection.

