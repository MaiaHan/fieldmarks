import { useMemo, useRef, useState } from 'react'
import PhotoView from '../components/PhotoView'
import { pairOf, type Photo, type SpeciesKey } from '../data/content'
import { saveRecord, type Participant, type Phase, type TrialRecord } from '../lib/session'

const CONFIDENCE = ['Guessing', 'Unsure', 'Fairly sure', 'Certain']

interface Props {
  phase: Exclude<Phase, 'practice'>
  photos: Photo[]
  participant: Participant
  onDone: (records: TrialRecord[]) => void
}

// Pre-/post-test: held-out photos never shown in practice, no feedback, no field-mark
// question (that question is part of the treatment). Only the answer and confidence.
export default function Test({ phase, photos, participant, onDone }: Props) {
  const sessionId = useMemo(() => crypto.randomUUID().slice(0, 8), [])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<SpeciesKey | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [records, setRecords] = useState<TrialRecord[]>([])
  const shownAt = useRef(performance.now())

  const photo = photos[index]
  const pair = pairOf(photo.species)

  function submit() {
    if (!answer || !confidence) return
    const record: TrialRecord = {
      sessionId,
      participant: participant.id,
      condition: participant.condition,
      phase,
      trial: index + 1,
      pair: pair.key,
      photoId: photo.id,
      species: photo.species,
      answer,
      correct: answer === photo.species,
      mark: '',
      markDiagnostic: false,
      confidence,
      requeued: false,
      responseMs: Math.round(performance.now() - shownAt.current),
      timestamp: new Date().toISOString(),
    }
    saveRecord(record)
    const all = [...records, record]
    if (index + 1 >= photos.length) {
      onDone(all)
      return
    }
    setRecords(all)
    setIndex(index + 1)
    setAnswer(null)
    setConfidence(null)
    shownAt.current = performance.now()
  }

  return (
    <section className="screen">
      <div className="progress" aria-label={`Question ${index + 1} of ${photos.length}`}>
        <div className="progress-bar test" style={{ width: `${(index / photos.length) * 100}%` }} />
        <span>
          {phase === 'pre' ? 'Pre-test' : 'Post-test'} · {index + 1} of {photos.length} · no feedback
        </span>
      </div>
      <PhotoView key={photo.id} photo={photo} caption={pair.question} />

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
        <legend>2. How sure are you?</legend>
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
        {index + 1 >= photos.length ? 'Finish' : 'Next →'}
      </button>
    </section>
  )
}
