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
  Flame,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useServiceStatus } from '../hooks/useServiceStatus'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/assistant', label: 'Aria', icon: BrainCircuit },
  { to: '/tools', label: 'Tools', icon: Grid3X3 },
  { to: '/chat', label: 'AI Chat', icon: MessageSquare },
  { to: '/local-models', label: 'Local Models', icon: Flame },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/memory', label: 'Memory', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { statuses } = useServiceStatus()
  const onlineCount = statuses.filter((s) => s.status === 'online').length

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-violet-200">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 tracking-wide">Strix</div>
            <div className="text-xs text-gray-400">AI Dashboard</div>
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
                  ? 'bg-violet-50 text-violet-700 border border-violet-100'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Status indicator */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Local Services</span>
            <span className="text-xs text-gray-400">{statuses.length} total</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                onlineCount > 0
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse'
                  : 'bg-gray-300',
              )}
            />
            <span className="text-xs text-gray-600">
              {onlineCount > 0 ? (
                <span className="text-emerald-600 font-medium">{onlineCount}</span>
              ) : (
                <span className="text-gray-400">0</span>
              )}{' '}
              online
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
