# FieldMarks

A short web tool that trains novice birders to tell apart three look-alike pairs —
Downy vs. Hairy Woodpecker, House vs. Purple Finch, and Cooper's vs. Sharp-shinned Hawk —
using interleaved practice and contrastive feedback. CS 6460 (Educational Technology) term project, Georgia Tech, Fall 2026.

Session: pre-test → comparison cards → 18 practice trials → post-test → two survey questions → results.
Learners are randomly assigned to interleaved or blocked practice (A/B evaluation).
All data stays in the browser unless the learner exports it as CSV.

Photos: iNaturalist observers under Creative Commons licenses; attribution is shown under every photo.

## Development

```sh
npm install
npm run dev      # http://localhost:5173  (#/annotate = region-box tool, dev only)
npm run build
```

URL options: `?cond=interleaved|blocked` forces a condition; `?demo` resets local data and uses a fixed trial order.
