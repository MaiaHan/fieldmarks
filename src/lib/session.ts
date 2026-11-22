import { pairOf, type Pair, type Photo, type SpeciesKey } from '../data/content'

const pairKeyOf = (s: SpeciesKey) => pairOf(s).key

export type Phase = 'pre' | 'practice' | 'post'
export type Condition = 'interleaved' | 'blocked'

export interface TrialRecord {
  sessionId: string
  participant: string
  condition: Condition
  phase: Phase
  trial: number
  pair: string
  photoId: string
  species: SpeciesKey
  answer: SpeciesKey
  correct: boolean
  mark: string
  markDiagnostic: boolean
  confidence: number
  requeued: boolean
  responseMs: number
  timestamp: string
}

export interface QueueItem {
  photo: Photo
  requeued: boolean
}

// A missed photo comes back this many trials later (retrieval after a short gap).
export const REQUEUE_GAP = 3

export type Rng = () => number

// Small seeded generator so ?demo replays the same session every time.
export function seeded(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function runOf<T>(order: T[], i: number, key: (x: T) => string): boolean {
  return i >= 2 && key(order[i]) === key(order[i - 1]) && key(order[i]) === key(order[i - 2])
}

// Interleaved, balanced queue: the same number of photos of every species in every
// pair, shuffled together so pairs and species alternate. No species and no pair
// appears three times in a row, so learners must re-read the bird on every trial
// instead of riding a streak.
export function buildQueue(pairs: Pair[], photos: Photo[], perPair: number, rng: Rng = Math.random): QueueItem[] {
  const picked = pairs.flatMap((pair) => {
    const perSpecies = Math.floor(perPair / pair.species.length)
    return pair.species.flatMap((s) => shuffle(photos.filter((p) => p.species === s.key), rng).slice(0, perSpecies))
  })
  const pairKey = new Map(pairs.flatMap((pr) => pr.species.map((s) => [s.key, pr.key] as const)))
  let order = picked
  for (let attempt = 0; attempt < 200; attempt++) {
    order = shuffle(picked, rng)
    const ok = order.every(
      (_, i) => !runOf(order, i, (p) => p.species) && (pairs.length < 2 || !runOf(order, i, (p) => pairKey.get(p.species)!)),
    )
    if (ok) break
  }
  return order.map((photo) => ({ photo, requeued: false }))
}

// Blocked control condition: all trials of one pair before the next (pair order
// shuffled), species still mixed inside each pair — the way a field guide groups a
// pair on facing pages. Same photos-per-species as the interleaved queue.
export function buildBlockedQueue(pairs: Pair[], photos: Photo[], perPair: number, rng: Rng = Math.random): QueueItem[] {
  return shuffle(pairs, rng).flatMap((pair) => buildQueue([pair], photos, perPair, rng))
}

export function requeue(queue: QueueItem[], index: number, keepInBlock = false): QueueItem[] {
  const next = [...queue]
  let end = next.length
  if (keepInBlock) {
    // In the blocked condition a missed bird returns before the block ends, so
    // the condition stays blocked.
    const pairOfItem = (q: QueueItem) => pairKeyOf(q.photo.species)
    const key = pairOfItem(queue[index])
    end = index + 1
    while (end < next.length && pairOfItem(next[end]) === key) end++
  }
  const at = Math.min(index + 1 + REQUEUE_GAP, end)
  next.splice(at, 0, { photo: queue[index].photo, requeued: true })
  return next
}

// Pre- and post-test forms: the held-out test photos split in half per species.
// Which half comes first is randomized per participant (counterbalancing), so a
// gain can't come from one half simply being easier.
export function testForms(testPhotos: Photo[], rng: Rng = Math.random): { pre: Photo[]; post: Photo[] } {
  const swap = rng() < 0.5
  const a: Photo[] = []
  const b: Photo[] = []
  const species = [...new Set(testPhotos.map((p) => p.species))]
  for (const s of species) {
    const ofSpecies = testPhotos.filter((p) => p.species === s)
    const half = Math.ceil(ofSpecies.length / 2)
    a.push(...ofSpecies.slice(0, half))
    b.push(...ofSpecies.slice(half))
  }
  const [pre, post] = swap ? [b, a] : [a, b]
  return { pre: shuffle(pre, rng), post: shuffle(post, rng) }
}

const PARTICIPANT_KEY = 'fieldmarks.participant.v1'

export interface Participant {
  id: string
  condition: Condition
}

// Random assignment on first visit, kept on this device so a returning learner
// stays in the same condition. ?cond=blocked|interleaved overrides (for demos).
export function getParticipant(override?: string | null): Participant {
  const forced = override === 'blocked' || override === 'interleaved' ? override : null
  try {
    const saved = JSON.parse(localStorage.getItem(PARTICIPANT_KEY) ?? 'null') as Participant | null
    if (saved && (!forced || saved.condition === forced)) return saved
  } catch {
    // fall through
  }
  const p: Participant = {
    id: crypto.randomUUID().slice(0, 6),
    condition: forced ?? (Math.random() < 0.5 ? 'interleaved' : 'blocked'),
  }
  try {
    localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(p))
  } catch {
    // ignore
  }
  return p
}

export interface SurveyRecord {
  participant: string
  condition: Condition
  predicted: number
  harder: string
  comment: string
  timestamp: string
}

const SURVEY_KEY = 'fieldmarks.survey.v1'

export function saveSurvey(s: SurveyRecord) {
  try {
    const all = JSON.parse(localStorage.getItem(SURVEY_KEY) ?? '[]')
    localStorage.setItem(SURVEY_KEY, JSON.stringify([...all, s]))
  } catch {
    // ignore
  }
}

export function loadSurveys(): SurveyRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SURVEY_KEY) ?? '[]')
  } catch {
    return []
  }
}

const STORAGE_KEY = 'fieldmarks.trials.v2'

export function loadRecords(): TrialRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveRecord(record: TrialRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...loadRecords(), record]))
  } catch {
    // Storage unavailable (private mode); the session still works in memory.
  }
}

export function clearRecords() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PARTICIPANT_KEY)
    localStorage.removeItem(SURVEY_KEY)
  } catch {
    // ignore
  }
}

export function toCsv(records: TrialRecord[]): string {
  const cols: (keyof TrialRecord)[] = [
    'participant', 'condition', 'phase', 'sessionId', 'trial', 'pair', 'photoId', 'species', 'answer', 'correct',
    'mark', 'markDiagnostic', 'confidence', 'requeued', 'responseMs', 'timestamp',
  ]
  const rows = records.map((r) => cols.map((c) => JSON.stringify(r[c])).join(','))
  const surveys = loadSurveys()
  const survey = surveys.length
    ? ['', '# survey', 'participant,condition,predicted,harder,comment,timestamp',
       ...surveys.map((v) => [v.participant, v.condition, v.predicted, v.harder, v.comment, v.timestamp].map((x) => JSON.stringify(x)).join(','))]
    : []
  return [cols.join(','), ...rows, ...survey].join('\n')
}

export function downloadCsv(records: TrialRecord[]) {
  const blob = new Blob([toCsv(records)], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `fieldmarks-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
