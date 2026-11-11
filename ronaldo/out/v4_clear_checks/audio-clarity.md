# Audio clarity checks

The new mix puts the narrator in front, with softer contact sounds and slower,
continuous music ducking. The original narration, licensed score, contact times,
word timestamps and 200-second edit are preserved. No noise reduction was used:
the cached narration has clean pauses and no recorded room-noise problem.

| Check | Previous export | New master | Result |
| --- | ---: | ---: | --- |
| Integrated loudness | -22.5 LUFS | -16.9 LUFS | PASS |
| True peak | -6.7 dBTP | -2.4 dBTP | PASS |
| Voice over music, median spoken word | — | 23.2 dB | PASS |
| Voice over music, 10th percentile | — | 18.0 dB | PASS |
| Contact bus peak | -7.5 dBTP | -25.6 dBTP | PASS |
| Passage-onset difference | — | 10 ms | PASS |
| Stereo 48 kHz / exactly 9,600,000 samples | — | 9,600,000 samples | PASS |
| Source files and word metadata | original files | unchanged | PASS |

Narration treatment: 75 Hz high-pass; -1.5 dB at 250 Hz; +1.5 dB at 2.6 kHz;
gentle 2.1:1 compression; one fixed loudness gain; rare-peak limiting with
latency compensation. The narration stays centered; the score stays stereo.
The music envelope uses 5 ms control points interpolated at the audio sample
rate, so it sounds the same in preview and full resolution exports.

Music credit: 'Ascension' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

The final AAC export should be checked separately for codec peak overshoot and
duration. Listen once on headphones and phone speakers for preferred voice tone
and balance; these listening choices cannot be established by level meters.
