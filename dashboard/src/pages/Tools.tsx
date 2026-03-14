import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import { TOOLS, CATEGORIES } from '../data/tools'
import type { ToolCategory } from '../types'
import { clsx } from 'clsx'
import { useServiceStatus } from '../hooks/useServiceStatus'

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const { statuses } = useServiceStatus()

  const filtered = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory =
        activeCategory === 'All' || tool.category === (activeCategory as ToolCategory)
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.tags?.some((t) => t.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <div className="animate-fade-in max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-header text-2xl">All Tools</h1>
        <p className="section-subheader">Browse and launch your AI tools and services</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search tools…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                activeCategory === cat
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                  : 'text-gray-400 hover:text-gray-200 bg-gray-900 hover:bg-gray-800 border border-gray-800',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500">
        Showing {filtered.length} of {TOOLS.length} tools
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((tool) => {
            const status = statuses.find((s) => s.id === tool.id)
            return <ToolCard key={tool.id} tool={tool} status={status} />
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No tools match your search.</p>
          <button
            className="btn-ghost mt-3 mx-auto"
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('All')
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
