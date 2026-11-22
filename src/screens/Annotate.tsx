import { useRef, useState } from 'react'
import { ALL_PHOTOS, pairOf, speciesOf, type Photo, type Region } from '../data/content'

// Dev-only tool: drag a box over the diagnostic region of each photo, then save.
// The Vite dev server writes the result back to src/data/photos.json.
export default function Annotate() {
  const [photos, setPhotos] = useState<Photo[]>(ALL_PHOTOS)
  // Saving rewrites photos.json and Vite reloads the page, so keep our place.
  const [index, setIndexState] = useState(() => Number(sessionStorage.getItem('fm.annotate.index') ?? 0))
  const setIndex = (i: number) => {
    sessionStorage.setItem('fm.annotate.index', String(i))
    setIndexState(i)
  }
  const [label, setLabel] = useState('bill')
  const [draft, setDraft] = useState<Region | null>(null)
  const [status, setStatus] = useState('')
  const start = useRef<{ x: number; y: number } | null>(null)
  const frame = useRef<HTMLDivElement>(null)

  const photo = photos[index]
  const region = draft ?? photo.region

  function update(patch: Partial<Photo>) {
    setPhotos((ps) => ps.map((p, i) => (i === index ? { ...p, ...patch } : p)))
    setStatus('unsaved changes')
  }

  function point(e: React.PointerEvent) {
    const box = frame.current!.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)),
    }
  }

  function onDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = point(e)
    setDraft(null)
  }

  function onMove(e: React.PointerEvent) {
    if (!start.current) return
    const p = point(e)
    const s = start.current
    setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y), label })
  }

  function onUp() {
    start.current = null
    if (draft && draft.w > 0.02 && draft.h > 0.02) {
      const round = (n: number) => Math.round(n * 1000) / 1000
      update({ region: { x: round(draft.x), y: round(draft.y), w: round(draft.w), h: round(draft.h), label } })
    }
    setDraft(null)
  }

  async function save() {
    const res = await fetch('/__fieldmarks/photos', { method: 'POST', body: JSON.stringify(photos, null, 2) + '\n' })
    setStatus(res.ok ? `saved ${new Date().toLocaleTimeString()}` : `save failed (${res.status})`)
  }

  const done = photos.filter((p) => p.region || p.exclude).length

  return (
    <section className="screen wide">
      <h1>Annotate photos</h1>
      <p className="muted">
        {done}/{photos.length} done · drag a box over the diagnostic area · {status}
      </p>
      <div className="row">
        <button onClick={() => setIndex(Math.max(0, index - 1))}>← Prev</button>
        <span>
          {index + 1}/{photos.length} · <strong>{speciesOf(photo.species).name}</strong>
        </span>
        <button onClick={() => setIndex(Math.min(photos.length - 1, index + 1))}>Next →</button>
        <select value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Region label">
          {pairOf(photo.species)
            .marks.filter((m) => m.diagnostic)
            .map((m) => (
              <option key={m.key} value={m.key}>
                {m.key}
              </option>
            ))}
        </select>
        <label>
          <input type="checkbox" checked={!!photo.exclude} onChange={(e) => update({ exclude: e.target.checked })} /> exclude
        </label>
        <button onClick={() => update({ region: undefined })}>Clear box</button>
        <button className="primary" onClick={save}>
          Save
        </button>
      </div>
      <div
        className="photo-frame annotate"
        ref={frame}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <img src={photo.largeUrl} alt="" draggable={false} />
        {region && (
          <div
            className="photo-region"
            style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.w * 100}%`, height: `${region.h * 100}%` }}
          >
            <span className="photo-region-label">{region.label}</span>
          </div>
        )}
      </div>
      <div className="thumbs">
        {photos.map((p, i) => (
          <button
            key={p.id}
            className={`thumb ${i === index ? 'selected' : ''} ${p.exclude ? 'excluded' : p.region ? 'marked' : ''}`}
            onClick={() => setIndex(i)}
            title={p.id}
          >
            <img src={p.url.replace('/medium.', '/square.')} alt="" />
          </button>
        ))}
      </div>
    </section>
  )
}
