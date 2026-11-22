import { useState } from 'react'
import { PAIRS } from '../data/content'
import { saveSurvey, type Participant } from '../lib/session'

// Asked after the post-test but before the score is shown, so the prediction is a
// genuine judgment of learning that can be compared with actual performance.
export default function Survey({ participant, total, onDone }: { participant: Participant; total: number; onDone: () => void }) {
  const [predicted, setPredicted] = useState<number | null>(null)
  const [harder, setHarder] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  function submit() {
    if (predicted === null || !harder) return
    saveSurvey({
      participant: participant.id,
      condition: participant.condition,
      predicted,
      harder,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    })
    onDone()
  }

  return (
    <section className="screen">
      <h1>Two quick questions</h1>
      <fieldset>
        <legend>1. How many of the {total} final-quiz birds do you think you got right?</legend>
        <div className="row">
          <input
            type="range"
            min={0}
            max={total}
            value={predicted ?? Math.round(total / 2)}
            onChange={(e) => setPredicted(Number(e.target.value))}
            aria-label="Predicted correct"
            style={{ flex: 1 }}
          />
          <strong style={{ minWidth: '4ch' }}>{predicted ?? '—'}</strong>
        </div>
      </fieldset>
      <fieldset>
        <legend>2. Which pair was hardest to learn?</legend>
        <div className="choices chips">
          {PAIRS.map((p) => (
            <button
              key={p.key}
              className={harder === p.key ? 'chip selected' : 'chip'}
              aria-pressed={harder === p.key}
              onClick={() => setHarder(p.key)}
            >
              {p.short}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Anything else? (optional)</legend>
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: '100%', font: 'inherit' }} />
      </fieldset>
      <button className="primary" disabled={predicted === null || !harder} onClick={submit}>
        See my results →
      </button>
    </section>
  )
}
