import PhotoView from '../components/PhotoView'
import type { Pair, Photo } from '../data/content'

export function Home({ onStart, pastTrials }: { onStart: () => void; pastTrials: number }) {
  return (
    <section className="screen">
      <h1>FieldMarks</h1>
      <p className="lede">Learn to tell look-alike birds apart by the marks that matter.</p>
      <div className="card">
        <h2>Why this matters</h2>
        <p>
          Volunteers send millions of bird sightings to eBird, and scientists use them to track
          populations. The most common mistakes are between species that look almost the same.
          FieldMarks trains three classic pairs: Downy vs. Hairy Woodpecker, House vs. Purple
          Finch, and Cooper’s vs. Sharp-shinned Hawk. A wrong ID is a wrong data point.
        </p>
        <h2>How it works</h2>
        <ol>
          <li>A short warm-up quiz (18 photos, no feedback) to see where you start.</li>
          <li>Study one card per pair that shows the difference.</li>
          <li>
            Practice on 18 real photos. Before you see the answer, say what you looked at and how
            sure you are. Feedback puts the two species side by side, and birds you miss come back.
          </li>
          <li>A final quiz on new photos, two quick questions, then your before-and-after score.</li>
        </ol>
        <p className="muted">About 15 minutes · works on a phone · nothing is sent anywhere unless you export it</p>
      </div>
      <button className="primary" onClick={onStart}>
        Start
      </button>
      {pastTrials > 0 && <p className="muted center">{pastTrials} practice trials saved on this device.</p>}
    </section>
  )
}

export function TestIntro({ phase, onStart }: { phase: 'pre' | 'post'; onStart: () => void }) {
  return (
    <section className="screen">
      <h1>{phase === 'pre' ? 'Warm-up quiz' : 'Final quiz'}</h1>
      <div className="card">
        {phase === 'pre' ? (
          <p>
            Before any instruction, identify 18 photos from the three pairs. You won’t see the answers
            yet — guessing is fine and expected. This tells us where you started.
          </p>
        ) : (
          <p>
            Same format as the warm-up: 18 photos, no feedback. These are <strong>new photos</strong>{' '}
            you haven’t seen in practice, so this measures whether you can identify a bird you’ve
            never met — the situation you face in the field.
          </p>
        )}
      </div>
      <button className="primary" onClick={onStart}>
        Begin →
      </button>
    </section>
  )
}

function primerPhoto(photos: Photo[], key: string, preferred?: string) {
  const ofSpecies = photos.filter((p) => p.species === key)
  return (
    ofSpecies.find((p) => p.id === preferred) ??
    ofSpecies.find((p) => p.region?.label === 'bill') ??
    ofSpecies.find((p) => p.region) ??
    ofSpecies[0]
  )
}

export function Primer({ pairs, photos, onStart }: { pairs: Pair[]; photos: Photo[]; onStart: () => void }) {
  return (
    <section className="screen">
      <h1>Three pairs, one question each</h1>
      <p className="lede">
        Practice will mix all three pairs. For each pair, learn which marks separate the two
        species — and which ones only look useful.
      </p>
      {pairs.map((pair) => (
        <div key={pair.key} className="primer-pair">
          <h2>{pair.title}</h2>
          <p>{pair.lede}</p>
          <div className="compare">
            {pair.species.map((s) => (
              <div key={s.key} className="primer-card">
                <PhotoView photo={primerPhoto(photos, s.key, s.primerPhoto)} highlight caption={s.name} />
                <p>
                  <em>{s.latin}</em>
                </p>
                <dl>
                  {pair.traits.map((t) => (
                    <div key={t.key}>
                      <dt>{t.label}</dt>
                      <dd>{s.traits[t.key]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <div className="card">
            <strong>Rule of thumb:</strong> {pair.rule}
          </div>
        </div>
      ))}
      <button className="primary" onClick={onStart}>
        Start practice →
      </button>
    </section>
  )
}
