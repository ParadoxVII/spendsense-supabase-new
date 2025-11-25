"use client"

import type { ParsedStatementGroup } from "@/lib/db-types"

interface DashboardTabProps {
  parsedGroups?: ParsedStatementGroup[]
}

export default function DashboardTab({ parsedGroups }: DashboardTabProps) {
  // Flatten parsed groups into entries for computation
  const entries: {
    date: string
    time: number
    value: number
    signed: number
    is_expense: boolean
    description: string
    statement_name?: string
  }[] = []

  parsedGroups?.forEach((g) => {
    if (!g.parsed) return
    g.parsed.forEach((e) => {
      const time = Number(new Date(e.date)) || 0
      const signed = e.is_expense ? -Math.abs(Number(e.value) || 0) : Number(e.value) || 0
      entries.push({
        date: e.date,
        time,
        value: Number(e.value) || 0,
        signed,
        is_expense: !!e.is_expense,
        description: e.description,
        statement_name: g.statement_name,
      })
    })
  })

  // Sort by time ascending
  entries.sort((a, b) => a.time - b.time)

  // Totals
  const totalSigned = entries.reduce((s, e) => s + e.signed, 0)
  const totalIncome = entries.reduce((s, e) => s + (e.signed > 0 ? e.signed : 0), 0)
  const totalExpenses = Math.abs(entries.reduce((s, e) => s + (e.signed < 0 ? e.signed : 0), 0))

  // Biggest single expense
  const biggestExpense = entries.filter((e) => e.is_expense).reduce((max, e) => (e.value > max ? e.value : max), 0)

  // Top expenses by description
  const expenseGroups = entries
    .filter((e) => e.is_expense)
    .reduce<Record<string, number>>((acc, e) => {
      const key = e.description || "(unknown)"
      acc[key] = (acc[key] || 0) + e.value
      return acc
    }, {})

  const topExpenses = Object.entries(expenseGroups)
    .map(([desc, amt]) => ({ desc, amt }))
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 5)

  // Running balance for sparkline
  const running: number[] = []
  let acc = 0
  entries.forEach((e) => {
    acc += e.signed
    running.push(acc)
  })

  // Helper: render simple sparkline from running array
  function Sparkline({ points }: { points: number[] }) {
    if (!points || points.length === 0) return <div className="text-sm text-gray-400">No data</div>
    const w = 240
    const h = 48
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const step = w / Math.max(points.length - 1, 1)
    const pts = points
      .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
      .join(" ")
    return (
      <svg className="w-full h-12" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline fill="none" stroke="#60a5fa" strokeWidth={2} points={pts} />
      </svg>
    )
  }

  // Helper: horizontal percentage bar
  function PercentBar({ income, expense }: { income: number; expense: number }) {
    const total = income + expense || 1
    const incPct = Math.round((income / total) * 100)
    const expPct = 100 - incPct
    return (
      <div className="w-full bg-muted rounded h-4 overflow-hidden">
        <div className="h-4 bg-green-400" style={{ width: `${incPct}%` }} />
        <div className="h-4 bg-red-400" style={{ width: `${expPct}%` }} />
      </div>
    )
  }

  // Helper: simple bars for top expenses
  function TopExpenseBars({ items }: { items: { desc: string; amt: number }[] }) {
    if (!items || items.length === 0) return <div className="text-sm text-gray-400">No expenses</div>
    const max = Math.max(...items.map((i) => i.amt)) || 1
    return (
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.desc} className="flex items-center gap-3">
            <div className="w-40 text-sm text-muted-foreground truncate">{it.desc}</div>
            <div className="flex-1 bg-muted h-3 rounded overflow-hidden">
              <div className="h-3 bg-red-400" style={{ width: `${(it.amt / max) * 100}%` }} />
            </div>
            <div className="w-20 text-right text-sm">${it.amt.toFixed(2)}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold text-white mb-4">Your Dashboard</h2>

      {entries.length === 0 ? (
        <p className="text-gray-400">No parsed transactions available. Upload statements to see insights.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary cards */}
          <div className="col-span-1 bg-card p-4 rounded">
            <h3 className="text-sm text-muted-foreground">Balance</h3>
            <div className={`text-2xl font-bold ${totalSigned >= 0 ? 'text-green-400' : 'text-red-400'}`}>{'$' + totalSigned.toFixed(2)}</div>
            <div className="mt-3">
              <Sparkline points={running} />
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Running balance over time</div>
          </div>

          <div className="col-span-1 bg-card p-4 rounded">
            <h3 className="text-sm text-muted-foreground">Income vs Expenses</h3>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex-1">
                <PercentBar income={totalIncome} expense={totalExpenses} />
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-green-400">Income ${totalIncome.toFixed(2)}</span>
                  <span className="text-red-400">Expenses ${totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 bg-card p-4 rounded">
            <h3 className="text-sm text-muted-foreground">Biggest Expense</h3>
            <div className="text-xl font-semibold text-red-400 mt-2">${biggestExpense.toFixed(2)}</div>
            <div className="mt-3 text-sm text-muted-foreground">Top 5 expenses</div>
            <div className="mt-3">
              <TopExpenseBars items={topExpenses} />
            </div>
          </div>

          {/* Full list by statement */}
          <div className="col-span-1 md:col-span-3 bg-card p-4 rounded">
            <h3 className="text-sm text-muted-foreground mb-3">Parsed Statements</h3>
            <div className="space-y-4">
              {parsedGroups?.map((group) => (
                <div key={group.statement_id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{group.statement_name}</div>
                    <div className="text-sm text-muted-foreground">{group.parsed ? `${group.parsed.length} entries` : "No parsed data"}</div>
                  </div>
                  {group.parsed ? (
                    <ul className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      {group.parsed.map((entry, idx) => (
                        <li key={idx} className="flex justify-between">
                          <div className="truncate">{entry.date} — {entry.description}</div>
                          <div className={entry.is_expense ? "text-red-400" : "text-green-400"}>${entry.value.toFixed(2)}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-2 text-sm text-gray-400">No parsed data for this statement.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}