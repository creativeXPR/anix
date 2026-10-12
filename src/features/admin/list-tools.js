import { useState } from 'react'

// Shared by every /admin list so long ones stay manageable: a chip filter,
// a text search and "show more" paging (20 at a time).
export const PAGE = 20

export function useListTools(items, { match, text }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(PAGE)

  const needle = search.trim().toLowerCase()
  const filtered = (items || []).filter(
    (item) => (filter === 'all' || match(item, filter)) && (!needle || text(item).toLowerCase().includes(needle)),
  )

  return {
    filter,
    setFilter: (next) => {
      setFilter(next)
      setShown(PAGE)
    },
    search,
    setSearch: (next) => {
      setSearch(next)
      setShown(PAGE)
    },
    filtered,
    visible: filtered.slice(0, shown),
    remaining: Math.max(0, filtered.length - shown),
    showMore: () => setShown((n) => n + PAGE),
    countFor: (key) => (key === 'all' ? (items || []).length : (items || []).filter((item) => match(item, key)).length),
  }
}
