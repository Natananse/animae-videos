# Revision pass 2 source delivery

The published source branch is [`revision-pass-2-source`](https://github.com/Natananse/animae-videos/tree/revision-pass-2-source). Local `main`, its earlier history and unrelated workspace changes are preserved.

The earlier unpushed history includes old videos and WAV files above GitHub's 100 MB limit. Publishing the existing `main` ancestry would include those blobs even when the current files are ignored. This delivery therefore imports the current project source onto a branch rooted at the existing remote `main` commit, `422e6d6377c5726f72d1b39f32460d7859a7d4d3`. It does not rewrite or force-push either history.

| Section | Local main commit | Published source commit |
| --- | --- | --- |
| 1 — framing | `67d2f75e` | `9919ec2e` |
| 2 — narration sync | `8cfdd1e3` | `944546e7` |
| 3 — trophies and facts | `0650e954` | `ae7f2260` |
| 4 — automated checks and preview evidence | `e24f69f7` | `f91cb833` |

Each published tree exactly matches the tracked `ronaldo/` source and root `.gitignore` at its corresponding local snapshot. The existing remote root README is retained. The additional `e3857ed2` framing change from the concurrent work is preserved in the snapshots.

The initial normal HTTPS push reached GitHub but lacked command-line credentials. The connected GitHub app then published exact blobs, trees and commits. Every blob SHA and resulting tree was verified; each branch update used `force: false` and the expected previous head. The different local and published commit IDs reflect authorship metadata, while the checked source trees are identical.

MP4s, dependencies, render caches and sound masters are excluded from source commits. Check frames and full render audit data remain generated artifacts under `out/checks/`; the human-readable sync tables are retained as review evidence. The unrelated `.aws` deletion and other session's untracked work are left untouched.

The final section-five mapping and remote-head verification are recorded in `out/git-delivery.json` after publication. The isolated source worktree is aligned to the verified published head after retaining its local snapshot commits under a backup ref. Local `main` remains unchanged by that alignment.

## Clear audio and continuous motion follow-up

The v4 follow-up preserves all preceding history and outputs. Tested code and preview were saved on local main `2c57e74e` and published as `aa9e2fe1`. The completed delivery adds final/720p/browser evidence. Its exact mapping is in generated `out/v4_clear_checks/git-delivery.json`, which remains separate from the preceding pass receipt. Generated `public/audio/*.wav` masters are ignored; all 11 existing small source SFX WAVs remain in source. No MP4 or generated clarity master is committed.
