import { PAIRS } from '../data/content'
import { downloadCsv, loadRecords, loadSurveys, type TrialRecord } from '../lib/session'

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 100)}%` : '—'
}

function mean(xs: number[]) {
  return xs.length ? (xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(1) : '—'
}

interface Props {
  records: TrialRecord[]
  pre?: TrialRecord[]
  post?: TrialRecord[]
  onAgain: () => void
  onHome: () => void
}

function score(rs: TrialRecord[], pair?: string) {
  const sub = pair ? rs.filter((r) => r.pair === pair) : rs
  return { ok: sub.filter((r) => r.correct).length, n: sub.length }
}

export default function Summary({ records, pre = [], post = [], onAgain, onHome }: Props) {
  const survey = loadSurveys().at(-1)
  const preS = score(pre)
  const postS = score(post)
  const firstTry = records.filter((r) => !r.requeued)
  const half = Math.ceil(firstTry.length / 2)
  const early = firstTry.slice(0, half)
  const late = firstTry.slice(half)
  const correct = firstTry.filter((r) => r.correct).length
  const diagnostic = records.filter((r) => r.markDiagnostic).length
  const retried = records.filter((r) => r.requeued)

  const byPair = PAIRS.map((pair) => {
    const rs = firstTry.filter((r) => r.pair === pair.key)
    return {
      pair,
      n: rs.length,
      ok: rs.filter((r) => r.correct).length,
      diagnostic: records.filter((r) => r.pair === pair.key && r.markDiagnostic).length,
      all: records.filter((r) => r.pair === pair.key).length,
      species: pair.species.map((s) => {
        const ss = rs.filter((r) => r.species === s.key)
        return { name: s.name, n: ss.length, ok: ss.filter((r) => r.correct).length }
      }),
    }
  }).filter((p) => p.n > 0)

  return (
    <section className="screen">
      <h1>Your results</h1>
      {post.length > 0 && (
        <div className="card">
          <h2>Before and after (new photos, no feedback)</h2>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">
                {preS.ok}/{preS.n} → {postS.ok}/{postS.n}
              </span>
              <span className="stat-label">warm-up quiz → final quiz</span>
            </div>
            {survey && (
              <div className="stat">
                <span className="stat-value">
                  {survey.predicted} vs. {postS.ok}
                </span>
                <span className="stat-label">you predicted vs. actual on the final quiz</span>
              </div>
            )}
          </div>
          <table className="marks-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Warm-up</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.map((p) => {
                const a = score(pre, p.key)
                const b = score(post, p.key)
                return (
                  <tr key={p.key}>
                    <th>{p.short}</th>
                    <td>{a.ok}/{a.n}</td>
                    <td>{b.ok}/{b.n}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <h2>Practice</h2>
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{pct(correct, firstTry.length)}</span>
          <span className="stat-label">correct on first try ({correct}/{firstTry.length})</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {pct(early.filter((r) => r.correct).length, early.length)} → {pct(late.filter((r) => r.correct).length, late.length)}
          </span>
          <span className="stat-label">first half → second half</span>
        </div>
        <div className="stat">
          <span className="stat-value">{pct(diagnostic, records.length)}</span>
          <span className="stat-label">answers based on a diagnostic mark</span>
        </div>
        <div className="stat">
          <span className="stat-value">{pct(retried.filter((r) => r.correct).length, retried.length)}</span>
          <span className="stat-label">correct on missed birds' return ({retried.length})</span>
        </div>
      </div>

      <div className="card">
        <h2>By pair</h2>
        <table className="marks-table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Correct (first try)</th>
              <th>By species</th>
              <th>Used a diagnostic mark</th>
            </tr>
          </thead>
          <tbody>
            {byPair.map((p) => (
              <tr key={p.pair.key}>
                <th>{p.pair.short}</th>
                <td>
                  {pct(p.ok, p.n)} ({p.ok}/{p.n})
                </td>
                <td>{p.species.map((s) => `${s.name.split(' ')[0]} ${s.ok}/${s.n}`).join(' · ')}</td>
                <td>{pct(p.diagnostic, p.all)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Confidence check</h2>
        <p>
          Average confidence when right: <strong>{mean(records.filter((r) => r.correct).map((r) => r.confidence))}</strong>{' '}
          · when wrong: <strong>{mean(records.filter((r) => !r.correct).map((r) => r.confidence))}</strong> (1–4).
        </p>
        <p className="muted">
          Practice that mixes species and pairs often <em>feels</em> harder than studying one at a time,
          even when it teaches more. Look at the numbers, not the feeling.
        </p>
      </div>

      <div className="row">
        <button className="primary" onClick={onAgain}>
          Practice again
        </button>
        <button onClick={() => downloadCsv(loadRecords())}>Export all trials (CSV)</button>
        <button onClick={onHome}>Home</button>
      </div>
    </section>
  )
}
