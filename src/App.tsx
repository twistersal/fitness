import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { DAYS, DEFAULT_WEEK, ROUTINES, SHIFTS, TARGET, type Routine, type Shift, type ShiftCode } from './data'
import { useLocal } from './store'

interface Meal { t: string; n: string; k: number; p: number; c: number; f: number }
interface Day { d: Record<string, boolean>; s: number; m: Meal[]; w: { t: string; ml: number }[]; ld: Record<string, string> }
type Plan = Record<number, { sh?: ShiftCode; wr?: string }>
interface Ctx { sel: number; sh: Shift; r: Routine; D: Day; setD: (f: (d: Day) => Day) => void; wt: number }

const EMPTY: Day = { d: {}, s: 0, m: [], w: [], ld: {} }
const PAGES = [['today', 'Today'], ['shift', 'Shift'], ['meals', 'Meals'], ['workout', 'Workout'], ['water', 'Water']] as const
type Page = (typeof PAGES)[number][0]

const now = new Date()
const today = (now.getDay() + 6) % 7
const dt = (i: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - today + i)
const dk = (i: number) => { const d = dt(i); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
const fd = (i: number) => dt(i).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const mins = (t: string) => { const [a, b] = t.split(':'); return +a * 60 + +b }
const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const pct = (v: number, hi: number) => Math.min(100, (v / hi) * 100)
const rng = (a: [number, number]) => `${a[0]}–${a[1]}`
const hhmm = () => new Date().toTimeString().slice(0, 5)

function usePage(): Page {
  const get = (): Page => {
    const h = location.hash.slice(1)
    return PAGES.some((p) => p[0] === h) ? (h as Page) : 'today'
  }
  const [p, setP] = useState<Page>(get)
  useEffect(() => {
    const f = () => { setP(get()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return p
}

function Chk({ c, id, label, sub }: { c: Ctx; id: string; label: string; sub?: ReactNode }) {
  return (
    <label className="row">
      <input type="checkbox" checked={!!c.D.d[id]} onChange={(e) => c.setD((d) => ({ ...d, d: { ...d.d, [id]: e.target.checked } }))} />
      <span><b>{label}</b>{sub && <small>{sub}</small>}</span>
    </label>
  )
}

function Bar({ v, hi, w }: { v: number; hi: number; w?: boolean }) {
  return <div className={`bar${w ? ' w' : ''}`}><i style={{ width: `${pct(v, hi)}%` }} /></div>
}

function Hero({ c }: { c: Ctx }) {
  const { sh, r, sel } = c
  return (
    <header className={`hero ${sh.c}`}>
      <h1>{r.rest ? 'Rest' : sh.wt}</h1>
      <p className="wo">{r.t}</p>
      <p className="sh">{DAYS[sel]}, {fd(sel)}{sel === today ? ' (today)' : ''}. {sh.n} shift {sh.h[0]}–{sh.h[1]}.</p>
    </header>
  )
}

const totals = (m: Meal[]) => m.reduce((a, x) => ({ k: a.k + x.k, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { k: 0, p: 0, c: 0, f: 0 })
const waterTotal = (D: Day) => D.w.reduce((a, e) => a + e.ml, 0)

function Today({ c }: { c: Ctx }) {
  const { sh, r, D, setD, wt } = c
  const ev: [string, ReactNode][] = [[sh.h[0], <div className={`shift ${sh.c}`}><b>{sh.n} shift</b><small>{sh.h[0]}–{sh.h[1]}</small></div>]]
  if (!r.rest) {
    const gap = mins(sh.wt) - mins(sh.pre[0])
    ev.push([sh.pre[0], <Chk c={c} id="pre" label={sh.pre[1]} sub={<>Clean carbs, e.g. banana or sweet potato{gap !== 90 && <em>{gap} min before training; the rule says 90.</em>}</>} />])
    ev.push([sh.wt, <Chk c={c} id="wo" label={r.t} sub="Workout" />])
    ev.push([sh.post[0], <Chk c={c} id="post" label={sh.post[1]} sub="Rice + chicken or fish + tempeh" />])
  } else if (r.prep) ev.push(['Any', <Chk c={c} id="prep" label="Meal prep" sub="For the upcoming week" />])
  ev.sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const T = totals(D.m)
  return (
    <>
      <Hero c={c} />
      <section className="card"><h2>Day plan</h2>
        <ol className="tl">{ev.map((e, i) => <li key={i}><time>{e[0]}</time>{e[1]}</li>)}</ol></section>
      <section className="card"><h2>Daily habits</h2>
        <Chk c={c} id="vac" label="Stomach vacuum" sub="5 rounds × 30 seconds, in the morning" />
        <div className="rw" style={{ marginTop: 8 }}><label htmlFor="st">Steps</label>
          <input id="st" type="number" inputMode="numeric" min={0} placeholder="0" value={D.s || ''} onChange={(e) => setD((d) => ({ ...d, s: +e.target.value || 0 }))} />
          <small>of 8,000</small></div>
        <Bar v={D.s} hi={8000} /></section>
      <section className="card"><h2>Progress</h2>
        <a href="#meals"><b>{fmt(T.k)}</b> of {rng(TARGET.k)} kcal</a><Bar v={T.k} hi={TARGET.k[1]} />
        <a href="#water"><b>{fmt(waterTotal(D))}</b> of {fmt(wt)} ml water</a><Bar v={waterTotal(D)} hi={wt} w /></section>
    </>
  )
}

function ShiftPage({ plan, setPlan, cur }: { plan: Plan; setPlan: (f: (p: Plan) => Plan) => void; cur: (i: number) => { sh: ShiftCode; wr: string } }) {
  return (
    <>
      <h2 className="pt">Shifts this week</h2>
      {DEFAULT_WEEK.map((_, i) => {
        const x = cur(i), s = SHIFTS[x.sh], r = ROUTINES[x.wr]
        return (
          <section key={i} className={`card ${s.c} sb`}>
            <div className="rw"><div><b>{DAYS[i]}</b><small>{fd(i)}{i === today ? ' (today)' : ''}</small></div>
              <select aria-label={`Shift for ${DAYS[i]}`} value={x.sh} onChange={(e) => setPlan((p) => ({ ...p, [i]: { ...p[i], sh: e.target.value as ShiftCode } }))}>
                {(Object.keys(SHIFTS) as ShiftCode[]).map((k) => <option key={k} value={k}>{k}: {SHIFTS[k].n} {SHIFTS[k].h[0]}–{SHIFTS[k].h[1]}</option>)}
              </select></div>
            <small>{r.rest ? r.t : `Train at ${s.wt}: ${r.t}`}</small>
          </section>
        )
      })}
      <button className="b g" onClick={() => setPlan(() => ({}))} disabled={!Object.keys(plan).length}>Reset week to default</button>
      <p className="note">Training and meal times follow the shift you pick. Change a day’s routine on the Workout page.</p>
    </>
  )
}

function MealForm({ onAdd }: { onAdd: (m: Meal) => void }) {
  const [f, setF] = useState({ n: '', t: hhmm(), k: '', p: '', c: '', f: '' })
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const add = () => {
    const n = f.n.trim(), k = +f.k || 0
    if (!n && !k) return
    onAdd({ t: f.t || '00:00', n, k, p: +f.p || 0, c: +f.c || 0, f: +f.f || 0 })
    setF({ ...f, n: '', k: '', p: '', c: '', f: '' })
  }
  const num = (k: keyof typeof f, ph: string) => <input type="number" inputMode="decimal" placeholder={ph} aria-label={ph} value={f[k]} onChange={set(k)} />
  return (
    <div className="fm">
      <input className="w2" placeholder="Meal name" aria-label="Meal name" value={f.n} onChange={set('n')} />
      <input className="w2" type="time" aria-label="Time" value={f.t} onChange={set('t')} />
      {num('k', 'kcal')}{num('p', 'P g')}{num('c', 'C g')}{num('f', 'F g')}
      <button className="b w4" onClick={add}>Add meal</button>
    </div>
  )
}

function Meals({ c }: { c: Ctx }) {
  const { sh, r, D, setD } = c
  const T = totals(D.m)
  const list = D.m.map((m, i) => ({ m, i })).sort((a, b) => (a.m.t < b.m.t ? -1 : 1))
  const lo = TARGET.p[0] * 4 + TARGET.c[0] * 4 + TARGET.f[0] * 9, hi = TARGET.p[1] * 4 + TARGET.c[1] * 4 + TARGET.f[1] * 9
  return (
    <>
      <Hero c={c} />
      <section className="card"><h2>Today’s totals</h2><b>{fmt(T.k)}</b> of {rng(TARGET.k)} kcal<Bar v={T.k} hi={TARGET.k[1]} />
        <div className="mac">{([['p', 'Protein'], ['c', 'Carbs'], ['f', 'Fats']] as const).map(([k, l]) => (
          <div key={k}><small>{l}</small><b>{fmt(T[k])} g</b><small>{rng(TARGET[k])}</small><Bar v={T[k]} hi={TARGET[k][1]} /></div>))}</div>
        <p className="note">Macro ranges add up to {fmt(lo)}–{fmt(hi)} kcal, so the calorie target only fits the upper part of them.</p></section>
      {!r.rest && <section className="card"><h2>Timing for this shift</h2>
        <p><b>{sh.pre[0]}</b> {sh.pre[1]}<small>Clean carbs, 1.5 hours before training is the rule.</small></p>
        <p><b>{sh.post[0]}</b> {sh.post[1]}<small>Within 1 hour after training.</small></p></section>}
      <section className="card"><h2>Log a meal</h2><MealForm onAdd={(m) => setD((d) => ({ ...d, m: [...d.m, m] }))} /></section>
      <section className="card"><h2>Logged meals</h2>
        {list.length ? list.map(({ m, i }) => (
          <div className="rw" style={{ padding: '6px 0' }} key={i}>
            <div><b>{m.t} {m.n || 'Meal'}</b><small>{fmt(m.k)} kcal, P {fmt(m.p)} / C {fmt(m.c)} / F {fmt(m.f)}</small></div>
            <button className="b g" aria-label="Delete meal" onClick={() => setD((d) => ({ ...d, m: d.m.filter((_, j) => j !== i) }))}>Delete</button>
          </div>)) : <p className="note">Nothing logged yet. Add your first meal above.</p>}</section>
    </>
  )
}

function Workout({ c, rk, setRoutine, last, setLast }: { c: Ctx; rk: string; setRoutine: (k: string) => void; last: Record<string, string>; setLast: (f: (p: Record<string, string>) => Record<string, string>) => void }) {
  const { r, D, setD, sel } = c
  const setLoad = (e: string, v: string) => { setD((d) => ({ ...d, ld: { ...d.ld, [e]: v } })); setLast((p) => ({ ...p, [e]: v })) }
  return (
    <>
      <Hero c={c} />
      <section className="card"><h2>Plan for {DAYS[sel]}</h2>
        <select style={{ width: '100%' }} aria-label="Workout routine" value={rk} onChange={(e) => setRoutine(e.target.value)}>
          {Object.entries(ROUTINES).map(([k, v]) => <option key={k} value={k}>{v.t}</option>)}</select></section>
      <section className="card"><h2>{r.t}</h2>
        {r.rest ? <p>{r.rest}</p> : (
          <>
            <p><b>Warm-up</b><small>{r.warm}</small></p>
            {r.core?.map((e, i) => (
              <div key={e}><Chk c={c} id={`ex${i}`} label={e} />
                {e.startsWith('Backpack') && (
                  <div className="rw ld"><small>Backpack load (kg)</small>
                    <input type="number" inputMode="decimal" min={0} step={0.5} style={{ width: 90 }} aria-label={`Load for ${e}`} value={D.ld[e] ?? last[e] ?? ''} onChange={(ev) => setLoad(e, ev.target.value)} /></div>)}
              </div>))}
            {r.cardio && <Chk c={c} id="cardio" label={r.cardio} />}
            <p><b>Cool-down</b><small>{r.cool}</small></p>
          </>)}</section>
    </>
  )
}

function Water({ c, setWt }: { c: Ctx; setWt: (n: number) => void }) {
  const { D, setD, wt } = c
  const [cu, setCu] = useState('')
  const t = waterTotal(D), n = D.w.length
  const add = (ml: number) => { if (ml > 0) setD((d) => ({ ...d, w: [...d.w, { t: hhmm(), ml }] })) }
  return (
    <>
      <Hero c={c} />
      <section className="card"><div className="big">{fmt(t)}<span> ml</span></div><Bar v={t} hi={wt} w />
        <small>{t >= wt ? 'Target reached' : `${fmt(wt - t)} ml to go`} of {fmt(wt)} ml. {n} {n === 1 ? 'entry' : 'entries'} logged.</small>
        <div className="wb">{[150, 250, 500].map((v) => <button key={v} className="b" onClick={() => add(v)}>+{v} ml</button>)}
          <button className="b g" onClick={() => setD((d) => ({ ...d, w: d.w.slice(0, -1) }))}>Undo last</button></div>
        <div className="rw"><input type="number" inputMode="numeric" min={0} placeholder="Custom ml" style={{ flex: 1 }} value={cu} onChange={(e) => setCu(e.target.value)} />
          <button className="b" onClick={() => { add(+cu || 0); setCu('') }}>Add</button></div></section>
      <section className="card"><h2>Daily target</h2>
        <div className="rw"><input type="number" inputMode="numeric" min={500} step={100} style={{ width: 120 }} aria-label="Daily water target in ml" defaultValue={wt} onBlur={(e) => setWt(Math.max(500, +e.target.value || 2300))} />
          <small>ml. Default is about 35 ml per kg for 66 kg: a rule of thumb, not part of your plan.</small></div></section>
    </>
  )
}

export default function App() {
  const page = usePage()
  const [sel, setSel] = useState(today)
  const [plan, setPlan] = useLocal<Plan>(`sf:plan:${dk(0)}`, {})
  const [raw, setRaw] = useLocal<Partial<Day>>(`sf:day:${dk(sel)}`, {})
  const [wt, setWt] = useLocal<number>('sf:wt', 2300)
  const [last, setLast] = useLocal<Record<string, string>>('sf:ld', {})
  const D: Day = { ...EMPTY, ...raw }
  const setD = (f: (d: Day) => Day) => setRaw((p) => f({ ...EMPTY, ...p }))
  const cur = (i: number) => ({ sh: plan[i]?.sh ?? DEFAULT_WEEK[i][0], wr: plan[i]?.wr ?? DEFAULT_WEEK[i][1] })
  const x = cur(sel)
  const c: Ctx = { sel, sh: SHIFTS[x.sh], r: ROUTINES[x.wr], D, setD, wt }
  return (
    <>
      <main>
        {page !== 'shift' && (
          <nav className="wk" aria-label="Day">
            {DEFAULT_WEEK.map((_, i) => (
              <button key={i} className={`${SHIFTS[cur(i).sh].c}${i === sel ? ' on' : ''}`} aria-pressed={i === sel} onClick={() => setSel(i)}>
                <span>{DAYS[i].slice(0, 3)}</span><b>{cur(i).sh}</b></button>))}
          </nav>)}
        {page === 'today' && <Today c={c} />}
        {page === 'shift' && <ShiftPage plan={plan} setPlan={setPlan} cur={cur} />}
        {page === 'meals' && <Meals c={c} />}
        {page === 'workout' && <Workout c={c} rk={x.wr} last={last} setLast={setLast} setRoutine={(k) => setPlan((p) => ({ ...p, [sel]: { ...p[sel], wr: k } }))} />}
        {page === 'water' && <Water c={c} setWt={setWt} />}
      </main>
      <nav className="tabs">
        {PAGES.map(([k, l]) => <a key={k} href={`#${k}`} className={k === page ? 'on' : ''} aria-current={k === page ? 'page' : undefined}>{l}</a>)}
      </nav>
    </>
  )
}
