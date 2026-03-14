import { useState, useEffect } from 'react'
import { RefreshCw, Cpu, HardDrive, MemoryStick, Clock, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'
import { useServiceStatus } from '../hooks/useServiceStatus'
import type { SystemStats } from '../types'

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generates mock system stats for demonstration. Replace with real system metrics
// (e.g. via /api/stats endpoint backed by `os` module or `systeminformation` package).
function generateStats(): SystemStats {
  return {
    cpuUsage: randomBetween(10, 75),
    memoryUsage: randomBetween(6, 14),
    memoryTotal: 16,
    diskUsage: randomBetween(200, 350),
    diskTotal: 512,
    uptime: randomBetween(3600, 864000),
    activeServices: randomBetween(2, 8),
    totalServices: 10,
  }
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function BarChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
      <div
        className={clsx('h-full rounded-full transition-all duration-1000', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const w = 80
  const h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<SystemStats>(generateStats)
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 12 }, () => randomBetween(10, 70)),
  )
  const [refreshing, setRefreshing] = useState(false)
  const { statuses, refetch } = useServiceStatus()

  useEffect(() => {
    const iv = setInterval(() => {
      setStats(generateStats())
      setHistory((prev) => [...prev.slice(1), randomBetween(10, 70)])
    }, 5000)
    return () => clearInterval(iv)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setStats(generateStats())
    setTimeout(() => setRefreshing(false), 600)
  }

  const onlineCount = statuses.filter((s) => s.status === 'online').length
  const offlineCount = statuses.filter((s) => s.status === 'offline').length

  const modelUsage = [
    { name: 'GPT-4o', usage: randomBetween(30, 60), color: 'bg-green-500' },
    { name: 'Claude 3.5', usage: randomBetween(20, 45), color: 'bg-amber-500' },
    { name: 'Gemini Pro', usage: randomBetween(10, 30), color: 'bg-blue-500' },
    { name: 'Ollama', usage: randomBetween(5, 25), color: 'bg-teal-500' },
    { name: 'DeepSeek', usage: randomBetween(5, 20), color: 'bg-cyan-500' },
  ]
  const totalUsage = modelUsage.reduce((acc, m) => acc + m.usage, 0)

  return (
    <div className="animate-fade-in max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header text-2xl">Analytics</h1>
          <p className="section-subheader">System health and service monitoring</p>
        </div>
        <button
          onClick={handleRefresh}
          className={clsx('btn-secondary', refreshing && 'opacity-70 pointer-events-none')}
        >
          <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'CPU Usage',
            value: `${stats.cpuUsage}%`,
            icon: Cpu,
            bar: stats.cpuUsage,
            barMax: 100,
            barColor:
              stats.cpuUsage > 80
                ? 'bg-red-500'
                : stats.cpuUsage > 60
                  ? 'bg-yellow-500'
                  : 'bg-violet-500',
          },
          {
            label: 'Memory',
            value: `${stats.memoryUsage} / ${stats.memoryTotal} GB`,
            icon: MemoryStick,
            bar: stats.memoryUsage,
            barMax: stats.memoryTotal,
            barColor: 'bg-blue-500',
          },
          {
            label: 'Disk',
            value: `${stats.diskUsage} / ${stats.diskTotal} GB`,
            icon: HardDrive,
            bar: stats.diskUsage,
            barMax: stats.diskTotal,
            barColor: 'bg-emerald-500',
          },
          {
            label: 'Uptime',
            value: formatUptime(stats.uptime),
            icon: Clock,
            bar: null,
            barMax: 0,
            barColor: '',
          },
        ].map(({ label, value, icon: Icon, bar, barMax, barColor }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-400">{label}</span>
            </div>
            <div className="text-xl font-bold text-gray-100 mb-3">{value}</div>
            {bar !== null && <BarChart value={bar} max={barMax} color={barColor} />}
          </div>
        ))}
      </div>

      {/* CPU sparkline */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-gray-200">CPU Activity (last 60s)</h2>
          </div>
          <span className="text-xs text-gray-500">Updates every 5s</span>
        </div>
        <div className="h-16 flex items-end gap-1">
          {history.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-violet-600/60 transition-all duration-700"
              style={{ height: `${Math.max(4, v)}%` }}
              title={`${v}%`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>60s ago</span>
          <span>now</span>
        </div>
      </div>

      {/* Service status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Local Service Health</h2>
          <div className="space-y-3">
            {statuses.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={clsx(
                      s.status === 'online'
                        ? 'status-dot-online'
                        : s.status === 'checking'
                          ? 'status-dot-checking'
                          : 'status-dot-offline',
                    )}
                  />
                  <span className="text-sm text-gray-300">{s.name}</span>
                  {s.port && <span className="text-[10px] text-gray-600">:{s.port}</span>}
                </div>
                <div className="flex items-center gap-3">
                  {s.latency && (
                    <span className="text-xs text-gray-600">{s.latency}ms</span>
                  )}
                  <span
                    className={clsx(
                      'badge text-[10px]',
                      s.status === 'online'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : s.status === 'checking'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-gray-800 text-gray-500 border border-gray-700',
                    )}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 text-xs text-gray-500">
            <span>
              <span className="text-green-400 font-medium">{onlineCount}</span> online
            </span>
            <span>
              <span className="text-gray-500 font-medium">{offlineCount}</span> offline
            </span>
          </div>
        </div>

        {/* Model usage */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Model Usage (session)</h2>
          <div className="space-y-3">
            {modelUsage.map((m) => (
              <div key={m.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{m.name}</span>
                  <span className="text-xs text-gray-500">
                    {Math.round((m.usage / totalUsage) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-700', m.color)}
                    style={{ width: `${(m.usage / totalUsage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <MiniSparkline data={history} />
            <p className="text-[10px] text-gray-600 mt-1">API request rate over time</p>
          </div>
        </div>
      </div>
    </div>
  )
}
