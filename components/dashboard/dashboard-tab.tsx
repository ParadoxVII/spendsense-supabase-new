"use client"

import type { ParsedStatementGroup } from "@/lib/db-types"

interface DashboardTabProps {
  parsedGroups?: ParsedStatementGroup[]
}

export default function DashboardTab({ parsedGroups }: DashboardTabProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold text-white mb-4">Your Dashboard</h2>

      {!parsedGroups || parsedGroups.length === 0 ? (
        <p className="text-gray-400">No parsed transactions available. Upload statements to see insights.</p>
      ) : (
        <div className="space-y-6">
          {parsedGroups.map((group) => (
            <div key={group.statement_id} className="bg-card p-4 rounded">
              <h3 className="font-semibold mb-2">{group.statement_name}</h3>
              {group.parsed ? (
                <ul className="space-y-1 text-sm">
                  {group.parsed.map((entry, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">{entry.date} — {entry.description}</span>
                      <span className={entry.is_expense ? "text-red-400" : "text-green-400"}>
                        {entry.value.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No parsed data for this statement.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}