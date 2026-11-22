import { useMemo, useRef, useState } from 'react'
import PhotoView from '../components/PhotoView'
import { pairOf, speciesOf, type Pair, type Photo, type SpeciesKey } from '../data/content'
import {
  buildBlockedQueue, buildQueue, requeue, saveRecord, seeded, REQUEUE_GAP,
  type Participant, type QueueItem, type TrialRecord,
} from '../lib/session'

const CONFIDENCE = ['Guessing', 'Unsure', 'Fairly sure', 'Certain']

interface Props {
  pairs: Pair[]
  photos: Photo[]
  perPair: number
  participant: Participant
  demo?: boolean
  onDone: (records: TrialRecord[]) => void
}

export default function Practice({ pairs, photos, perPair, participant, demo = false, onDone }: Props) {
  const blocked = participant.condition === 'blocked'
  const sessionId = useMemo(() => crypto.randomUUID().slice(0, 8), [])
  // ?demo replays one fixed, seeded session for recording walkthroughs.
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    (blocked ? buildBlockedQueue : buildQueue)(pairs, photos, perPair, demo ? seeded(6460) : Math.random),
  )
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<SpeciesKey | null>(null)
  const [mark, setMark] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [result, setResult] = useState<TrialRecord | null>(null)
  const [records, setRecords] = useState<TrialRecord[]>([])
  const shownAt = useRef(performance.now())

  const item = queue[index]
  const photo = item.photo
  const pair = pairOf(photo.species)
  const [a, b] = pair.species
  const other = photo.species === a.key ? b : a

  // A photo of the other species for side-by-side comparison; prefer one with a
  // marked diagnostic region so the contrast is signaled on both sides.
  const contrast = useMemo(() => {
    const pool = photos.filter((p) => p.species === other.key)
    const marked = pool.filter((p) => p.region)
    const from = marked.length ? marked : pool
    if (demo) return pool.find((p) => p.id === other.primerPhoto) ?? from[0]
    return from[Math.floor(Math.random() * from.length)]
  }, [photo.id, other, photos, demo])

  function submit() {
    if (!answer || !mark || !confidence) return
    const fm = pair.marks.find((m) => m.key === mark)!
    const record: TrialRecord = {
      sessionId,
      participant: participant.id,
      condition: participant.condition,
      phase: 'practice',
      trial: index + 1,
      pair: pair.key,
      photoId: photo.id,
      species: photo.species,
      answer,
      correct: answer === photo.species,
      mark,
      markDiagnostic: fm.diagnostic,
      confidence,
      requeued: item.requeued,
      responseMs: Math.round(performance.now() - shownAt.current),
      timestamp: new Date().toISOString(),
    }
    saveRecord(record)
    setRecords((rs) => [...rs, record])
    setResult(record)
    // A missed bird comes back once; missing it again doesn't grow the session further.
    if (!record.correct && !item.requeued) setQueue((q) => requeue(q, index, blocked))
  }

  function next() {
    if (index + 1 >= queue.length) {
      onDone(records)
      return
    }
    setIndex(index + 1)
    setAnswer(null)
    setMark(null)
    setConfidence(null)
    setResult(null)
    shownAt.current = performance.now()
  }

  const progress = (
    <div className="progress" aria-label={`Trial ${index + 1} of ${queue.length}`}>
      <div className="progress-bar" style={{ width: `${(index / queue.length) * 100}%` }} />
      <span>
        Trial {index + 1} of {queue.length}
        {' · '}
        {pair.short}
        {item.requeued && ' · seen before'}
      </span>
    </div>
  )

  if (result) {
    const truth = speciesOf(photo.species)
    const picked = speciesOf(result.answer)
    const fm = pair.marks.find((m) => m.key === result.mark)!
    return (
      <section className="screen">
        {progress}
        <div className={`verdict ${result.correct ? 'ok' : 'miss'}`} role="status">
          <span aria-hidden>{result.correct ? '✓' : '✗'}</span>
          {result.correct
            ? `Correct — this is a ${truth.name}.`
            : `Not quite — this is a ${truth.name}, not a ${picked.name}.`}
        </div>

        <div className="compare">
          <PhotoView photo={photo} highlight caption={`This bird: ${truth.name}`} />
          <PhotoView photo={contrast} highlight caption={`Compare: ${other.name}`} />
        </div>

        <table className="marks-table">
          <thead>
            <tr>
              <th />
              <th>{truth.name}</th>
              <th>{other.name}</th>
            </tr>
          </thead>
          <tbody>
            {pair.traits.map((t) => (
              <tr key={t.key}>
                <th>{t.label}</th>
                <td>{truth.traits[t.key]}</td>
                <td>{other.traits[t.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={`mark-note ${fm.diagnostic ? 'good' : 'warn'}`}>
          <strong>You relied on: {fm.label}.</strong>{' '}
          {fm.diagnostic ? 'Good choice — that is a diagnostic mark. ' : 'That cue won’t separate these two. '}
          {fm.note}
        </div>

        {!result.correct && !item.requeued && (
          <p className="hint">This photo will come back in about {REQUEUE_GAP} trials.</p>
        )}
        {result.correct && result.confidence <= 2 && (
          <p className="hint">You got it right while unsure — the diagnostic marks are more reliable than your gut feeling.</p>
        )}
        {!result.correct && result.confidence >= 3 && (
          <p className="hint">You were confident but wrong — that is exactly the mistake that ends up in eBird data.</p>
        )}

        <button className="primary" onClick={next} autoFocus>
          {index + 1 >= queue.length ? 'See results' : 'Next bird →'}
        </button>
      </section>
    )
  }

  return (
    <section className="screen">
      {progress}
      <PhotoView photo={photo} caption={pair.question} />

      <fieldset>
        <legend>1. Your answer</legend>
        <div className="choices two">
          {pair.species.map((s) => (
            <button
              key={s.key}
              className={answer === s.key ? 'choice selected' : 'choice'}
              aria-pressed={answer === s.key}
              onClick={() => setAnswer(s.key)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={!answer}>
        <legend>2. What did you look at?</legend>
        <div className="choices chips">
          {pair.marks.map((m) => (
            <button
              key={m.key}
              className={mark === m.key ? 'chip selected' : 'chip'}
              aria-pressed={mark === m.key}
              onClick={() => setMark(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={!mark}>
        <legend>3. How sure are you?</legend>
        <div className="choices four">
          {CONFIDENCE.map((label, i) => (
            <button
              key={label}
              className={confidence === i + 1 ? 'choice selected' : 'choice'}
              aria-pressed={confidence === i + 1}
              onClick={() => setConfidence(i + 1)}
            >
              <span className="num">{i + 1}</span> {label}
            </button>
          ))}
        </div>
      </fieldset>

      <button className="primary" disabled={!confidence} onClick={submit}>
        Check answer
      </button>
    </section>
  )
}
