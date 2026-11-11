import {writeFileSync, mkdirSync} from 'node:fs';
import {BICYCLE_CUES, HOOK_CUES, CHILD_CUES, CHILD_EXIT_START_RUN, dribbleCues} from '../src/animation/football.ts';
import {KEEPER_CUES} from '../src/scenes/goalkeeperMotion.ts';

const cues = [];
const add = (time, kind, gain = .6) => cues.push({time, kind, gain});
const group = (offset, source, gain = .6) => source.forEach((cue) => add(offset + cue.time, cue.kind, gain));
const walk = (offset, duration, speed, gain = .5) => {
  for (let time = 0; time < duration; time += .36 / speed) add(offset + time, 'step', gain);
};
group(0, HOOK_CUES, .82);
add(KEEPER_CUES.hook.push, 'step', .28);
add(KEEPER_CUES.hook.land, 'land', .32);
add(4.6, 'cloth', .55);
group(6, CHILD_CUES, .66);
group(36, dribbleCues(11), .48); walk(36 + 14.2, 5.8, .45);
walk(56, 6, .45); group(56 + 6, dribbleCues(7), .53);
group(56 + 15, dribbleCues(10), .53);
group(92, dribbleCues(12), .5);
group(92 + 12, BICYCLE_CUES, .8);
add(104 + KEEPER_CUES.full.push, 'step', .28);
add(104 + KEEPER_CUES.full.land, 'land', .32);
group(92 + 23.3, dribbleCues(9.7), .48);
add(112.7, 'applause', .5);
group(132, dribbleCues(6.7), .48); walk(132 + 6.7, 6.5, .48);
group(132 + 13.2, dribbleCues(6.8), .48);
group(152, dribbleCues(11.3), .48); walk(152 + 23.1, 4, .33, .4);
add(165, 'cheer', .45); add(173.5, 'cloth', .5); add(184.5, 'cloth', .4);
// Scene08 now reveals the child at 189s, on the words “another child”.
for (let time = 189 + CHILD_EXIT_START_RUN; time < 199.5; time += .36) add(time, 'step', .5);
mkdirSync('.cache', {recursive: true});
writeFileSync('.cache/sound_cues.json', JSON.stringify(cues.sort((a, b) => a.time - b.time), null, 2) + '\n');
console.log(`Prepared ${cues.length} contact-synchronized Foley cues.`);
