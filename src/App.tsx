import { useEffect, useMemo, useState } from 'react'
import { PAIRS, PRACTICE_PHOTOS, TEST_PHOTOS } from './data/content'
import { clearRecords, getParticipant, loadRecords, seeded, testForms, type TrialRecord } from './lib/session'
import { Home, Primer, TestIntro } from './screens/Intro'
import Test from './screens/Test'
import Survey from './screens/Survey'
import Practice from './screens/Practice'
import Summary from './screens/Summary'
import Annotate from './screens/Annotate'

type Screen = 'home' | 'preIntro' | 'pre' | 'primer' | 'practice' | 'postIntro' | 'post' | 'survey' | 'summary'

// Six practice trials per pair (3 per species) = 18, in the participant's condition.
const TRIALS_PER_PAIR = 6

// ?demo gives a fixed trial order for recording walkthroughs, starting from a clean slate.
// ?cond=blocked|interleaved forces a condition; otherwise it is randomly assigned.
const params = new URLSearchParams(location.search)
const DEMO = params.has('demo')
if (DEMO) clearRecords()
const PARTICIPANT = getParticipant(params.get('cond'))

function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const [screen, setScreen] = useState<Screen>('home')
  const [round, setRound] = useState(0)
  const [records, setRecords] = useState<TrialRecord[]>([])
  const [pre, setPre] = useState<TrialRecord[]>([])
  const [post, setPost] = useState<TrialRecord[]>([])
  const forms = useMemo(() => testForms(TEST_PHOTOS, DEMO ? seeded(42) : Math.random), [])

  useEffect(() => {
    scrollTo(0, 0)
  }, [screen, round])

  if (hash === '#/annotate' && import.meta.env.DEV) return <Annotate />

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen('home')}>
          FieldMarks
        </button>
        <span className="muted">{PAIRS.length} look-alike pairs</span>
        {(DEMO || import.meta.env.DEV) && (
          <span className="muted" style={{ marginLeft: 'auto' }}>
            {PARTICIPANT.id} · {PARTICIPANT.condition}
          </span>
        )}
      </header>
      <main>
        {screen === 'home' && <Home onStart={() => setScreen('preIntro')} pastTrials={loadRecords().length} />}
        {screen === 'preIntro' && <TestIntro phase="pre" onStart={() => setScreen('pre')} />}
        {screen === 'pre' && (
          <Test
            phase="pre"
            photos={forms.pre}
            participant={PARTICIPANT}
            onDone={(rs) => {
              setPre(rs)
              setScreen('primer')
            }}
          />
        )}
        {screen === 'postIntro' && <TestIntro phase="post" onStart={() => setScreen('post')} />}
        {screen === 'post' && (
          <Test
            phase="post"
            photos={forms.post}
            participant={PARTICIPANT}
            onDone={(rs) => {
              setPost(rs)
              setScreen('survey')
            }}
          />
        )}
        {screen === 'survey' && (
          <Survey participant={PARTICIPANT} total={forms.post.length} onDone={() => setScreen('summary')} />
        )}
        {screen === 'primer' && (
          <Primer pairs={PAIRS} photos={PRACTICE_PHOTOS} onStart={() => setScreen('practice')} />
        )}
        {screen === 'practice' && (
          <Practice
            key={round}
            pairs={PAIRS}
            photos={PRACTICE_PHOTOS}
            perPair={TRIALS_PER_PAIR}
            participant={PARTICIPANT}
            demo={DEMO}
            onDone={(rs) => {
              setRecords(rs)
              // Post-test only once per visit; "practice again" goes straight to results.
              setScreen(post.length ? 'summary' : 'postIntro')
            }}
          />
        )}
        {screen === 'summary' && (
          <Summary
            records={records}
            pre={pre}
            post={post}
            onAgain={() => {
              setRound((r) => r + 1)
              setScreen('practice')
            }}
            onHome={() => setScreen('home')}
          />
        )}
      </main>
    </>
  )
}
