import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Grid3X3,
  MessageSquare,
  BarChart3,
  Settings,
  Zap,
  BrainCircuit,
  BookOpen,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useServiceStatus } from '../hooks/useServiceStatus'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/assistant', label: 'Aria', icon: BrainCircuit },
  { to: '/tools', label: 'Tools', icon: Grid3X3 },
  { to: '/chat', label: 'AI Chat', icon: MessageSquare },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/memory', label: 'Memory', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { statuses } = useServiceStatus()
  const onlineCount = statuses.filter((s) => s.status === 'online').length

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Strix</div>
            <div className="text-xs text-gray-500">AI Dashboard</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Status indicator */}
      <div className="p-4 border-t border-white/10">
        <div className="glass-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">Local Services</span>
            <span className="text-xs text-gray-500">{statuses.length} total</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                onlineCount > 0
                  ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)] animate-pulse'
                  : 'bg-gray-600',
              )}
            />
            <span className="text-xs text-gray-300">
              {onlineCount > 0 ? (
                <span className="text-green-400 font-medium">{onlineCount}</span>
              ) : (
                <span className="text-gray-500">0</span>
              )}{' '}
              online
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
