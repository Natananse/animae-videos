# Voice-to-visual sync checks

Source audit: 2026-11-11T14:52:54.063Z. Character visibility at least 8%: 3000/3000 rendered frames (100.0%).
Frames extracted with ffmpeg from out/ronaldo_emotional_v3_sync2_preview.mp4 at each exact key-word timestamp.

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

Connected flat-region audit: 3000 frames, maximum 20.57%, 0 failures. Native-resolution RGB24, fixed 16/256 channel bins, four-neighbor connected components; cinematic letterbox excluded; no downscaling.

Failures: 0.
