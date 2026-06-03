export type SortOrder = "asc" | "desc"

export type TableSortState<K extends string = string> = {
  key: K
  order: SortOrder
}

export function toggleTableSort<K extends string>(
  current: TableSortState<K>,
  key: K,
  defaultOrder: SortOrder = "desc",
): TableSortState<K> {
  if (current.key === key) {
    return { key, order: current.order === "desc" ? "asc" : "desc" }
  }
  return { key, order: defaultOrder }
}
