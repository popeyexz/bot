import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, BrainCircuit, Server, TrendingUp, Activity } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import { TOOLS } from '../data/tools'
import { useServiceStatus } from '../hooks/useServiceStatus'

const FEATURED_IDS = [
  'stable-diffusion',
  'comfyui',
  'ollama',
  'chatgpt',
  'claude',
  'n8n',
]

const FEATURED = FEATURED_IDS.map((id) => TOOLS.find((t) => t.id === id)!).filter(Boolean)

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string
  value: string | number
  icon: React.FC<{ className?: string }>
  color: string
  sub?: string
}) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} flex-shrink-0 shadow-md`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { statuses } = useServiceStatus()
  const onlineCount = statuses.filter((s) => s.status === 'online').length
  const localCount = TOOLS.filter((t) => t.isLocal).length
  const aiModels = 5

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Welcome back{' '}
          <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            ✦
          </span>
        </h1>
        <p className="text-gray-500 text-sm">
          Your AI tools hub — launch, manage, and chat with AI models.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tools"
          value={TOOLS.length}
          icon={Boxes}
          color="from-violet-500 to-purple-600"
          sub="across 6 categories"
        />
        <StatCard
          label="AI Models"
          value={aiModels}
          icon={BrainCircuit}
          color="from-blue-500 to-cyan-600"
          sub="GPT-4o, Claude, Gemini..."
        />
        <StatCard
          label="Local Services"
          value={localCount}
          icon={Server}
          color="from-teal-500 to-emerald-600"
          sub={`${onlineCount} currently online`}
        />
        <StatCard
          label="Services Online"
          value={onlineCount}
          icon={Activity}
          color={onlineCount > 0 ? 'from-green-500 to-emerald-600' : 'from-gray-400 to-gray-500'}
          sub={onlineCount === 0 ? 'none detected' : 'healthy'}
        />
      </div>

      {/* Featured tools */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-header">Featured Tools</h2>
            <p className="section-subheader">Quick access to your most-used AI tools</p>
          </div>
          <Link to="/tools" className="btn-ghost text-violet-600 hover:text-violet-700">
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {FEATURED.map((tool) => {
            const status = statuses.find((s) => s.id === tool.id)
            return <ToolCard key={tool.id} tool={tool} status={status} compact />
          })}
        </div>
      </div>

      {/* Service status overview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-violet-600" />
          <h2 className="text-base font-semibold text-gray-800">Local Service Status</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {statuses.map((s) => (
            <div key={s.id} className="glass-card p-3 flex items-center gap-3">
              <span
                className={
                  s.status === 'online'
                    ? 'status-dot-online'
                    : s.status === 'checking'
                      ? 'status-dot-checking'
                      : 'status-dot-offline'
                }
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{s.name}</div>
                <div className="text-xs text-gray-400">
                  {s.status === 'online'
                    ? s.latency
                      ? `${s.latency}ms`
                      : 'online'
                    : s.status === 'checking'
                      ? 'checking…'
                      : 'offline'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
