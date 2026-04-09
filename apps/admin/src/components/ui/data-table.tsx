'use client'

import { useState } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  emptyIcon?: string
  rowKey?: (row: T) => string
  onRowClick?: (row: T) => void
  /** Pagination */
  page?: number
  total?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Không có dữ liệu',
  emptyIcon = '📋',
  rowKey,
  onRowClick,
  page = 1,
  total,
  pageSize = 20,
  onPageChange,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey] ?? ''
        const bv = b[sortKey] ?? ''
        const cmp = String(av).localeCompare(String(bv), 'vi')
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  const totalPages = total ? Math.ceil(total / pageSize) : 1

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="p-12 text-center text-on-surface-variant animate-pulse">
          Đang tải dữ liệu…
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/15 bg-surface-low/40">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`text-left px-6 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:text-on-surface select-none' : ''
                  } ${col.className ?? ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-on-surface-variant">
                  <p className="text-4xl mb-2">{emptyIcon}</p>
                  <p className="text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`hover:bg-primary/[0.03] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-6 py-4 text-on-surface ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant">
            Hiển thị {data.length} / {total} kết quả
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface-variant hover:bg-surface-highest disabled:opacity-30 transition-colors"
            >
              ← Trước
            </button>
            <span className="px-3 py-1.5 text-xs font-medium text-on-surface">
              Trang {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface-variant hover:bg-surface-highest disabled:opacity-30 transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
