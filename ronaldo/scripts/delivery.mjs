// Keep every delivery pass separate from preserved renders and review clips.
export const version = 'v4_clear';
export const checkDir = `out/${version}_checks`;
export const previewFps = 30;
export const finalFile = `out/ronaldo_emotional_${version}.mp4`;
export const previewFile = `out/ronaldo_emotional_${version}_preview.mp4`;
export const playbackFile = `out/ronaldo_emotional_${version}_720p.mp4`;
export const reviews = {
  'review-opening': [0, 10],
  'review-childhood': [10, 36],
  'review-walking': [48, 62],
  'review-supporting': [88, 92],
  'review-bicycle': [102, 114],
  'review-farewell': [174, 200],
  'review-ending': [184, 200],
};
export const reviewFile = (mode) => `out/${version}-${mode}.mp4`;
export const manifestFile = (mode) => `out/${version}_${mode}_render.json`;
