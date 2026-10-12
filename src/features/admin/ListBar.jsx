// Filter chips + search above an /admin list, and the "show more" footer.
// Pair with useListTools (list-tools.js).
export function ListBar({ tools, filters, placeholder = 'Search…' }) {
  return (
    <div className="admin-listbar">
      <div className="admin-chips" role="group" aria-label="Filter">
        {filters.map(({ key, label }) => (
          <button key={key} type="button" aria-pressed={tools.filter === key} onClick={() => tools.setFilter(key)}>
            {label}
            <span>{tools.countFor(key)}</span>
          </button>
        ))}
      </div>
      <input
        className="admin-search"
        type="search"
        value={tools.search}
        onChange={(event) => tools.setSearch(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}

export function ShowMore({ tools }) {
  if (!tools.remaining) return null
  return (
    <button type="button" className="admin-more" onClick={tools.showMore}>
      Show {Math.min(20, tools.remaining)} more · {tools.remaining} left
    </button>
  )
}

export function NoMatches({ tools, children }) {
  return <div className="admin-empty">{tools.filter !== 'all' || tools.search ? 'Nothing matches.' : children}</div>
}
