import data from '../../public/sync.json';

export type VisualCue = {
  action: string;
  outfit: string;
  props: string[];
  camera: string;
  start_word: string;
};
export type TrophyKind = 'champions-league' | 'premier-league' | 'ballon-dor' | 'fifa-player' | 'euro' | 'nations-league';
export type TrophyEvent = {
  id: string; sceneId: string; kind: TrophyKind; year: number;
  startSeconds: number; absoluteSeconds: number; count: number; cumulativeCount: number;
};
export type YearEvent = {year: number; startSeconds: number; absoluteSeconds: number};
export type SyncSentence = {
  id: string; sceneId: string; text: string;
  startSeconds: number; endSeconds: number; keySeconds: number; absoluteKeySeconds: number;
  visual_cue: VisualCue; years: YearEvent[]; trophies: TrophyEvent[]; expectedTrophyCount: number;
};
export const syncSentences = data.sentences as SyncSentence[];
export const trophyEvents = data.trophyEvents as TrophyEvent[];
export const yearEvents = data.yearEvents as (YearEvent & {sceneId: string; sentenceId: string})[];
/** Cues switch on the measured subject word, never an estimated sentence duration. */
export function sentenceAt(sceneId: string, localSeconds: number): SyncSentence | undefined {
  const rows = syncSentences.filter(sentence => sentence.sceneId === sceneId);
  return rows.filter(sentence => sentence.keySeconds <= localSeconds + 1e-6).at(-1) ?? rows[0];
}
export function trophiesAt(absoluteSeconds: number): TrophyEvent[] {
  return trophyEvents.filter(event => event.count > 0 && event.absoluteSeconds <= absoluteSeconds + 1e-6);
}
export function yearAt(sceneId: string, localSeconds: number): YearEvent | undefined {
  const year = yearEvents.filter(event => event.sceneId === sceneId && event.startSeconds <= localSeconds + 1e-6 && localSeconds < event.startSeconds + 2).at(-1);
  if (!year) return undefined;
  const cue = sentenceAt(sceneId, localSeconds);
  // End the previous card when a different prize/year is introduced; show the
  // next numeric card only on its measured spoken year, never an outdated date.
  const introducesDifferentYear = cue && cue.id !== year.sentenceId &&
    [...cue.years, ...cue.trophies].some(event => event.year !== year.year);
  return introducesDifferentYear ? undefined : year;
}
