# Voice-to-visual sync checks

Source audit: 2026-11-11T16:51:04.779Z. Character visibility at least 8%: 6000/6000 rendered frames (100.0%).
Frames extracted with ffmpeg from out/ronaldo_emotional_v4_clear.mp4 at each exact key-word timestamp.
Maximum actual first-frame delay: 32.59ms across sentences, trophy reveals and year cards. Actual frame number, time, outfit, action, cast, trophy IDs, year and clap onset are retained in results JSON.

| Sentence | Timestamp | Expected visual | Check result |
| --- | ---: | --- | --- |
| Portugal's seven is leaving international football. | 1.900s | reaction; portugal; number-seven-shirt; character-medium | PASS |
| Before the records, there was a boy chasing a ball. | 6.555s | run; portugal; ball; tracking | PASS |
| Funchal, Madeira. | 11.011s | dribble; portugal; ball, Madeira-street, sea; tracking | PASS |
| Home. | 12.358s | reaction; portugal; ball, Madeira-street, sea; character-medium | PASS |
| Cristiano Ronaldo was born here in nineteen eighty-five. | 19.198s | reaction; portugal; ball, year-card; character-medium | PASS |
| This island was the beginning of a very different life. | 21.386s | dribble; portugal; ball, Madeira-street, sea; tracking | PASS |
| Its small disappointments and victories belong to childhood. | 24.898s | training; portugal; ball; tracking | PASS |
| Nobody in this scene knows how far the boy will travel. | 29.727s | run; portugal; ball; tracking | PASS |
| Sporting gave him his first senior stage in two thousand and two. | 36.300s | training; sporting; ball, teammates, year-card; tracking | PASS |
| The game became faster and the space tighter. | 40.432s | training; sporting; ball, teammates; tracking | PASS |
| A pass needed the right weight. | 43.318s | training; sporting; ball, teammate; tracking | PASS |
| A run needed the right moment. | 45.602s | run; sporting; ball, teammate; tracking | PASS |
| His talent now had to work with teammates, against players who wanted the same ball. | 49.205s | training; sporting; ball, teammates, opponent; tracking | PASS |
| Manchester United signed him in two thousand and three. | 56.350s | run; united; Manchester-stadium, year-card; tracking | PASS |
| A teenager inherited the number seven shirt. | 61.527s | shirt; united; number-seven-shirt; character-medium | PASS |
| He arrived as a winger, full of speed and invention. | 63.459s | dribble; united; ball; tracking | PASS |
| His goals soon matched his tricks. | 66.334s | score; united; ball, goal; tracking | PASS |
| 2008. | 70.900s | celebrate; united; year-card; character-medium | PASS |
| The Champions League. | 72.150s | celebrate; united; champions-league; trophy-push | PASS |
| The Premier League. | 73.907s | celebrate; united; premier-league; trophy-push | PASS |
| His first Ballon d'Or. | 75.986s | celebrate; united; ballon-dor; trophy-push | PASS |
| The 2008 FIFA World Player of the Year award. | 78.384s | celebrate; united; fifa-player; trophy-push | PASS |
| Four prizes, one remarkable year. | 80.986s | celebrate; united; trophy-cabinet; character-medium | PASS |
| He lifts a trophy with his teammates. | 84.020s | lift; united; trophy, teammates, trophy-cabinet; trophy-wide | PASS |
| Then Madrid called. | 86.702s | reaction; madrid; Madrid-stadium; character-medium | PASS |
| Madrid brought him to Spain in two thousand and nine. | 92.300s | run; madrid; Madrid-stadium, year-card; tracking | PASS |
| Four Champions League titles. | 95.523s | celebrate; madrid; champions-league, trophy-cabinet; trophy-push | PASS |
| 2014. | 97.852s | celebrate; madrid; champions-league, year-card; trophy-push | PASS |
| 2016. | 99.000s | celebrate; madrid; champions-league, year-card; trophy-push | PASS |
| 2017. | 100.739s | celebrate; madrid; champions-league, year-card; trophy-push | PASS |
| 2018. | 101.841s | celebrate; madrid; champions-league, year-card; trophy-push | PASS |
| That finish, 2018. | 112.086s | reaction; madrid; year-card; character-medium | PASS |
| Juventus supporters stood to applaud his bicycle kick. | 115.036s | celebrate; madrid; applauding-supporters; character-medium | PASS |
| For a moment, rivalry gave way to appreciation. | 118.957s | reaction; madrid; supporters; character-medium | PASS |
| More Ballon d'Or wins in white: 2013. | 121.150s | celebrate; madrid; ballon-dor, trophy-cabinet, year-card; trophy-push | PASS |
| 2014. | 124.430s | celebrate; madrid; ballon-dor, year-card; trophy-push | PASS |
| 2016. | 125.577s | celebrate; madrid; ballon-dor, year-card; trophy-push | PASS |
| 2017. | 127.316s | celebrate; madrid; ballon-dor, year-card; trophy-push | PASS |
| Four more golden balls. | 128.452s | celebrate; madrid; trophy-cabinet; trophy-wide | PASS |
| Juventus, Turin, 2018. | 132.200s | training; juventus; Turin-training-ground, ball, year-card; tracking | PASS |
| A new dressing room, and new teammates. | 135.832s | reaction; juventus; dressing-room, teammates; character-medium | PASS |
| United again in twenty twenty-one. | 138.900s | run; united; Manchester-stadium, year-card; tracking | PASS |
| The familiar shirt, in a different moment. | 142.111s | shirt; united; number-seven-shirt; character-medium | PASS |
| Then Al Nassr, in Riyadh. | 145.673s | dribble; alnassr; Riyadh-stadium, ball; tracking | PASS |
| Portugal's red and green still linked him to home. | 147.793s | reaction; portugal; number-seven-shirt; character-medium | PASS |
| Portugal won Euro twenty sixteen. | 153.011s | celebrate; portugal; euro, year-card, trophy-cabinet; trophy-push | PASS |
| Nations League, 2019. | 155.155s | celebrate; portugal; nations-league, year-card, trophy-cabinet; trophy-push | PASS |
| Nations League, 2025. | 157.791s | celebrate; portugal; nations-league, year-card, trophy-cabinet; trophy-push | PASS |
| He lifts each cup. | 160.802s | lift; portugal; euro, nations-league, teammates; trophy-wide | PASS |
| Ronaldo became men's international record scorer. | 164.711s | score; portugal; ball, goal; tracking | PASS |
| On November fifth, twenty twenty-six, he announced his international retirement. | 170.000s | shirt; portugal; number-seven-shirt, year-card; character-medium | PASS |
| His club career continues. | 171.666s | reaction; alnassr; ball; character-medium | PASS |
| The farewell is to this shirt, and to the teammates and supporters who made it mean something. | 174.745s | shirt; portugal; number-seven-shirt, teammates, supporters; character-medium | PASS |
| The shirt will pass on. | 184.448s | shirt; portugal; number-seven-shirt; character-medium | PASS |
| The effort stays in memory. | 186.443s | reaction; portugal; number-seven-shirt; character-medium | PASS |
| Somewhere, another child is taking a ball into the light. | 189.284s | child-exit; portugal; ball; tracking | PASS |

## Actual video keyword frames

| Sentence | Requested time | Actual frame | Actual time | Delay | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| scene01-s01 | 1.900000s | 57 @ 30fps | 1.900000s | 0.00ms | PASS |
| scene01-s02 | 6.554540s | 197 @ 30fps | 6.566667s | 12.13ms | PASS |
| scene02-s01 | 11.011380s | 331 @ 30fps | 11.033333s | 21.95ms | PASS |
| scene02-s02 | 12.357960s | 371 @ 30fps | 12.366667s | 8.71ms | PASS |
| scene02-s03 | 19.197710s | 576 @ 30fps | 19.200000s | 2.29ms | PASS |
| scene02-s04 | 21.386380s | 642 @ 30fps | 21.400000s | 13.62ms | PASS |
| scene02-s05 | 24.897710s | 747 @ 30fps | 24.900000s | 2.29ms | PASS |
| scene02-s06 | 29.727290s | 892 @ 30fps | 29.733333s | 6.04ms | PASS |
| scene03-s01 | 36.300000s | 1089 @ 30fps | 36.300000s | 0.00ms | PASS |
| scene03-s02 | 40.431830s | 1213 @ 30fps | 40.433333s | 1.50ms | PASS |
| scene03-s03 | 43.318170s | 1300 @ 30fps | 43.333333s | 15.16ms | PASS |
| scene03-s04 | 45.602290s | 1369 @ 30fps | 45.633333s | 31.04ms | PASS |
| scene03-s05 | 49.204540s | 1477 @ 30fps | 49.233333s | 28.79ms | PASS |
| scene04-s01 | 56.350000s | 1691 @ 30fps | 56.366667s | 16.67ms | PASS |
| scene04-s02 | 61.527290s | 1846 @ 30fps | 61.533333s | 6.04ms | PASS |
| scene04-s03 | 63.459080s | 1904 @ 30fps | 63.466667s | 7.59ms | PASS |
| scene04-s04 | 66.334080s | 1991 @ 30fps | 66.366667s | 32.59ms | PASS |
| scene04-s05 | 70.900000s | 2127 @ 30fps | 70.900000s | 0.00ms | PASS |
| scene04-s06 | 72.150000s | 2165 @ 30fps | 72.166667s | 16.67ms | PASS |
| scene04-s07 | 73.906830s | 2218 @ 30fps | 73.933333s | 26.50ms | PASS |
| scene04-s08 | 75.986380s | 2280 @ 30fps | 76.000000s | 13.62ms | PASS |
| scene04-s09 | 78.384080s | 2352 @ 30fps | 78.400000s | 15.92ms | PASS |
| scene04-s10 | 80.986380s | 2430 @ 30fps | 81.000000s | 13.62ms | PASS |
| scene04-s11 | 84.020460s | 2521 @ 30fps | 84.033333s | 12.87ms | PASS |
| scene04-s12 | 86.702290s | 2602 @ 30fps | 86.733333s | 31.04ms | PASS |
| scene05-s01 | 92.300000s | 2769 @ 30fps | 92.300000s | 0.00ms | PASS |
| scene05-s02 | 95.522710s | 2866 @ 30fps | 95.533333s | 10.62ms | PASS |
| scene05-s03 | 97.852290s | 2936 @ 30fps | 97.866667s | 14.38ms | PASS |
| scene05-s04 | 99.000000s | 2970 @ 30fps | 99.000000s | 0.00ms | PASS |
| scene05-s05 | 100.738620s | 3023 @ 30fps | 100.766667s | 28.05ms | PASS |
| scene05-s06 | 101.840920s | 3056 @ 30fps | 101.866667s | 25.75ms | PASS |
| scene05-s07 | 112.086380s | 3363 @ 30fps | 112.100000s | 13.62ms | PASS |
| scene05-s08 | 115.036380s | 3452 @ 30fps | 115.066667s | 30.29ms | PASS |
| scene05-s09 | 118.956830s | 3569 @ 30fps | 118.966667s | 9.84ms | PASS |
| scene05-s10 | 121.150000s | 3635 @ 30fps | 121.166667s | 16.67ms | PASS |
| scene05-s11 | 124.429540s | 3733 @ 30fps | 124.433333s | 3.79ms | PASS |
| scene05-s12 | 125.577290s | 3768 @ 30fps | 125.600000s | 22.71ms | PASS |
| scene05-s13 | 127.315920s | 3820 @ 30fps | 127.333333s | 17.41ms | PASS |
| scene05-s14 | 128.452290s | 3854 @ 30fps | 128.466667s | 14.38ms | PASS |
| scene06-s01 | 132.200000s | 3966 @ 30fps | 132.200000s | 0.00ms | PASS |
| scene06-s02 | 135.831830s | 4075 @ 30fps | 135.833333s | 1.50ms | PASS |
| scene06-s03 | 138.900000s | 4167 @ 30fps | 138.900000s | 0.00ms | PASS |
| scene06-s04 | 142.111380s | 4264 @ 30fps | 142.133333s | 21.95ms | PASS |
| scene06-s05 | 145.672710s | 4371 @ 30fps | 145.700000s | 27.29ms | PASS |
| scene06-s06 | 147.793170s | 4434 @ 30fps | 147.800000s | 6.83ms | PASS |
| scene07-s01 | 153.011380s | 4591 @ 30fps | 153.033333s | 21.95ms | PASS |
| scene07-s02 | 155.154540s | 4655 @ 30fps | 155.166667s | 12.13ms | PASS |
| scene07-s03 | 157.790920s | 4734 @ 30fps | 157.800000s | 9.08ms | PASS |
| scene07-s04 | 160.802290s | 4825 @ 30fps | 160.833333s | 31.04ms | PASS |
| scene07-s05 | 164.711380s | 4942 @ 30fps | 164.733333s | 21.95ms | PASS |
| scene07-s06 | 170.000000s | 5100 @ 30fps | 170.000000s | 0.00ms | PASS |
| scene07-s07 | 171.665920s | 5150 @ 30fps | 171.666667s | 0.75ms | PASS |
| scene07-s08 | 174.745460s | 5243 @ 30fps | 174.766667s | 21.21ms | PASS |
| scene08-s01 | 184.447710s | 5534 @ 30fps | 184.466667s | 18.96ms | PASS |
| scene08-s02 | 186.443170s | 5594 @ 30fps | 186.466667s | 23.50ms | PASS |
| scene08-s03 | 189.284080s | 5679 @ 30fps | 189.300000s | 15.92ms | PASS |

## Trophy-keyword sentences

- 72.150s — The Champions League. **PASS**
- 73.907s — The Premier League. **PASS**
- 75.986s — His first Ballon d'Or. **PASS**
- 84.020s — He lifts a trophy with his teammates. **PASS**
- 95.523s — Four Champions League titles. **PASS**
- 121.150s — More Ballon d'Or wins in white: 2013. **PASS**
- 153.011s — Portugal won Euro twenty sixteen. **PASS**
- 155.155s — Nations League, 2019. **PASS**
- 157.791s — Nations League, 2025. **PASS**
- 160.802s — He lifts each cup. **PASS**

## Award reveals and cumulative cabinet

| Award ID | Timestamp | Expected count | Actual count | Result |
| --- | ---: | ---: | ---: | --- |
| scene04-s06-champions-league-2008-reveal | 72.150s | 1 | 1 | PASS |
| scene04-s07-premier-league-2008-reveal | 73.907s | 2 | 2 | PASS |
| scene04-s08-ballon-dor-2008-reveal | 75.986s | 3 | 3 | PASS |
| scene04-s09-fifa-player-2008-reveal | 78.384s | 4 | 4 | PASS |
| scene05-s02-champions-league-2014-reveal | 95.523s | 8 | 8 | PASS |
| scene05-s02-champions-league-2016-reveal | 95.523s | 8 | 8 | PASS |
| scene05-s02-champions-league-2017-reveal | 95.523s | 8 | 8 | PASS |
| scene05-s02-champions-league-2018-reveal | 95.523s | 8 | 8 | PASS |
| scene05-s03-champions-league-2014-focus | 97.852s | 8 | 8 | PASS |
| scene05-s04-champions-league-2016-focus | 99.000s | 8 | 8 | PASS |
| scene05-s05-champions-league-2017-focus | 100.739s | 8 | 8 | PASS |
| scene05-s06-champions-league-2018-focus | 101.841s | 8 | 8 | PASS |
| scene05-s10-ballon-dor-2013-reveal | 121.150s | 9 | 9 | PASS |
| scene05-s11-ballon-dor-2014-reveal | 124.430s | 10 | 10 | PASS |
| scene05-s12-ballon-dor-2016-reveal | 125.577s | 11 | 11 | PASS |
| scene05-s13-ballon-dor-2017-reveal | 127.316s | 12 | 12 | PASS |
| scene07-s01-euro-2016-reveal | 153.011s | 13 | 13 | PASS |
| scene07-s02-nations-league-2019-reveal | 155.155s | 14 | 14 | PASS |
| scene07-s03-nations-league-2025-reveal | 157.791s | 15 | 15 | PASS |

## Spoken year cards

| Sentence | Timestamp | Year | Result |
| --- | ---: | ---: | --- |
| scene02-s03 | 19.198s | 1985 | PASS |
| scene03-s01 | 38.470s | 2002 | PASS |
| scene04-s01 | 57.839s | 2003 | PASS |
| scene04-s05 | 70.900s | 2008 | PASS |
| scene04-s09 | 77.589s | 2008 | PASS |
| scene05-s01 | 93.630s | 2009 | PASS |
| scene05-s03 | 97.852s | 2014 | PASS |
| scene05-s04 | 99.000s | 2016 | PASS |
| scene05-s05 | 100.739s | 2017 | PASS |
| scene05-s06 | 101.841s | 2018 | PASS |
| scene05-s07 | 112.086s | 2018 | PASS |
| scene05-s10 | 122.695s | 2013 | PASS |
| scene05-s11 | 124.430s | 2014 | PASS |
| scene05-s12 | 125.577s | 2016 | PASS |
| scene05-s13 | 127.316s | 2017 | PASS |
| scene06-s01 | 133.768s | 2018 | PASS |
| scene06-s03 | 139.798s | 2021 | PASS |
| scene07-s01 | 153.432s | 2016 | PASS |
| scene07-s02 | 156.109s | 2019 | PASS |
| scene07-s03 | 158.745s | 2025 | PASS |
| scene07-s06 | 167.659s | 2026 | PASS |

Connected flat-region audit: 6000 frames, maximum 20.48%, 0 failures. Native-resolution RGB24, fixed 16/256 channel bins, four-neighbor connected components; cinematic letterbox excluded; no downscaling.

Failures: 0.
