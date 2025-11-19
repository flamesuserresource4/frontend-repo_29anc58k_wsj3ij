import { useEffect, useMemo, useRef, useState } from 'react'
import { Moon, Sun, Copy, History, Sigma, Sparkles, LineChart, Archive } from 'lucide-react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

function useTheme() {
  const [dark, setDark] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  ))
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [dark])
  return { dark, setDark }
}

function HistoryItem({ item, onClick }) {
  return (
    <button onClick={() => onClick(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.input}</div>
      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.result}</div>
    </button>
  )
}

export default function Calculator() {
  const [input, setInput] = useState('2^10 + sin(pi/4)')
  const [mode, setMode] = useState('auto')
  const [latex, setLatex] = useState(false)
  const [variable, setVariable] = useState('x')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const { dark, setDark } = useTheme()

  const controllerRef = useRef(null)

  async function solve() {
    setLoading(true)
    setError('')
    controllerRef.current?.abort()
    controllerRef.current = new AbortController()

    try {
      const res = await fetch(`${BACKEND}/api/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, mode, variable, latex }),
        signal: controllerRef.current.signal,
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(Array.isArray(data.result) ? data.result.join(', ') : data.result)
      setHistory(prev => [{ input, result: Array.isArray(data.result) ? data.result.join(', ') : data.result }, ...prev].slice(0, 20))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  // Graphing support
  const [graphData, setGraphData] = useState(null)
  async function graph() {
    setGraphData(null)
    try {
      const res = await fetch(`${BACKEND}/api/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: input, variable, latex }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setGraphData(data)
    } catch (e) {
      setError(String(e))
    }
  }

  useEffect(() => {
    // auto solve on load
    solve()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Sigma className="w-6 h-6 text-blue-600" />
          <span className="font-semibold">OmegaCalc</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="px-3 py-1 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500">Upgrade</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 order-last lg:order-first space-y-3">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium"><History className="w-4 h-4"/> History</div>
            <div className="space-y-1 max-h-[360px] overflow-auto">
              {history.length === 0 && <div className="text-xs text-slate-500">No history yet</div>}
              {history.map((h, i) => (
                <HistoryItem key={i} item={h} onClick={(it)=>{setInput(it.input); setResult(it.result)}}/>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Modes</div>
            <div className="grid grid-cols-2 gap-2">
              {['auto','simplify','derivative','integral','limit','solve','matrix'].map(m => (
                <button key={m} onClick={()=>setMode(m)} className={`px-2 py-2 rounded-lg border text-sm ${mode===m? 'bg-blue-600 text-white border-blue-600':'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{m}</button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={latex} onChange={e=>setLatex(e.target.checked)} /> LaTeX input
              </label>
              <input value={variable} onChange={e=>setVariable(e.target.value)} className="ml-auto w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent" placeholder="var"/>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3 space-y-4">
          <div className="p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Enter any math</div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} className="w-full h-28 lg:h-36 resize-y px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type expression, e.g., integrate(sin(x), x) or LaTeX like x^2 + 2x + 1" />
            <div className="mt-3 flex items-center gap-2">
              <button onClick={solve} disabled={loading} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4"/> Solve
              </button>
              <button onClick={graph} className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 inline-flex items-center gap-2">
                <LineChart className="w-4 h-4"/> Graph
              </button>
            </div>
          </div>

          <div className="p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-sm text-slate-500 dark:text-slate-400">
              <Archive className="w-4 h-4"/> Result
              <button onClick={()=>navigator.clipboard.writeText(result)} className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700"><Copy className="w-3 h-3"/> Copy</button>
            </div>
            {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
            <div className="text-lg font-mono whitespace-pre-wrap break-words">{loading? 'Calculating…' : (result || '—')}</div>
          </div>

          {graphData && (
            <div className="p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">Graph</div>
              <LinePlot data={graphData} />
            </div>
          )}
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-slate-500">
        Built for problem solvers • Step-by-step and API coming soon
      </footer>
    </div>
  )
}

function LinePlot({ data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.clientWidth * devicePixelRatio
    const height = canvas.height = 320 * devicePixelRatio

    // Clear
    ctx.clearRect(0,0,width,height)

    // Axes
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height/2)
    ctx.lineTo(width, height/2)
    ctx.moveTo(40, 0)
    ctx.lineTo(40, height)
    ctx.stroke()

    // Compute scaling
    const xs = data.x
    const ys = data.y
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const validY = ys.filter(y => y !== null && isFinite(y))
    const minY = validY.length ? Math.min(...validY) : -1
    const maxY = validY.length ? Math.max(...validY) : 1

    function xToPx(x) { return 40 + (x - minX) / (maxX - minX) * (width - 60) }
    function yToPx(y) { return height/2 - (y - (minY+maxY)/2) / (maxY - minY || 1) * (height * 0.8/2) }

    // Plot line
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    ys.forEach((y, i) => {
      const x = xs[i]
      if (y === null || !isFinite(y)) {
        ctx.moveTo(xToPx(x), yToPx(0))
      } else {
        const px = xToPx(x)
        const py = yToPx(y)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
    })
    ctx.stroke()
  }, [data])

  return <canvas ref={canvasRef} className="w-full h-[320px]" />
}
