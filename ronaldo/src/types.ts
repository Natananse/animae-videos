export type Word = {text: string; startMs: number; endMs: number};
export type TimedScene = {
  id: string;
  from: number;
  durationInFrames: number;
  voiceFrom: number;
  voiceDuration: number;
  words: Word[];
  speechRanges?: {start: number; end: number}[];
};
export type Timing = {fps: number; totalFrames: number; totalDuration?: number; scenes: TimedScene[]};
