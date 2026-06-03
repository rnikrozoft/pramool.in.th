"use client"

import Icon from "@/app/components/Icon"
import type { SortOrder, TableSortState } from "@/app/lib/tableSort"

type Align = "left" | "center" | "right"

const alignClass: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

type SortableTableHeadProps<K extends string> = {
  label: string
  sortKey?: K
  sort?: TableSortState<K>
  onSort?: (key: K) => void
  align?: Align
  className?: string
  sortable?: boolean
}

export function SortableTableHead<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  className = "",
  sortable = true,
}: SortableTableHeadProps<K>) {
  const canSort = sortable && sortKey && sort && onSort
  const active = canSort && sort.key === sortKey
  const order: SortOrder | null = active ? sort.order : null

  return (
    <th className={`px-4 py-3 ${alignClass[align]} ${className}`.trim()}>
      {canSort ? (
        <button
          type="button"
          className="table-sort-btn"
          data-active={active ? "true" : "false"}
          onClick={() => onSort(sortKey)}
          aria-label={`เรียงตาม${label}${active ? (order === "asc" ? " จากน้อยไปมาก" : " จากมากไปน้อย") : ""}`}
        >
          <span>{label}</span>
          {order === "desc" ? (
            <Icon name="fa-chevron-down" className="text-[0.625rem] text-brand-600 dark:text-brand-400" aria-hidden />
          ) : order === "asc" ? (
            <Icon name="fa-chevron-up" className="text-[0.625rem] text-brand-600 dark:text-brand-400" aria-hidden />
          ) : (
            <span className="inline-flex flex-col leading-none text-slate-400" aria-hidden>
              <Icon name="fa-chevron-up" className="mb-[-0.2em] text-[0.5rem]" />
              <Icon name="fa-chevron-down" className="text-[0.5rem]" />
            </span>
          )}
        </button>
      ) : (
        label
      )}
    </th>
  )
}
