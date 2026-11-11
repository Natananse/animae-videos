# Browser playback smoke test

File: `out/ronaldo_emotional_v4_clear.mp4`. Overall: **PASS**.

| Position | Playback advance | Displayed frames | Longest frame gap | Seek | Result |
| --- | --- | --- | --- | --- | --- |
| 0s | 3.397s / 3.517s | 95 | 0.160s | 0.0ms | PASS |
| 75s | 3.469s / 3.509s | 104 | 0.056s | 166.1ms | PASS |
| 160s | 3.469s / 3.510s | 104 | 0.050s | 288.5ms | PASS |
| 191s | 3.474s / 3.516s | 105 | 0.050s | 215.8ms | PASS |

Actual muted HTML5 playback and seeking in installed headless Chrome, via local HTTP byte ranges, after rendering/transcoding stopped. Local playback verifies decoding and seeking; it does not measure the viewer’s internet connection.

