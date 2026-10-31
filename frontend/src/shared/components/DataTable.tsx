import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: keyof T | ((item: T) => string);
  filterOptions?: { label: string; value: string; filterFn: (item: T) => boolean }[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  searchPlaceholder = "Search records...",
  searchKey,
  filterOptions,
  pageSize = 20,
  emptyMessage = "No records found.",
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered & searched data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search matching
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (typeof searchKey === "function") {
          matchesSearch = searchKey(item).toLowerCase().includes(query);
        } else if (searchKey) {
          const val = item[searchKey];
          matchesSearch = String(val ?? "").toLowerCase().includes(query);
        } else {
          // Default: check all string values in item
          matchesSearch = Object.values(item as Record<string, unknown>).some((val) =>
            String(val ?? "").toLowerCase().includes(query)
          );
        }
      }

      // Filter option matching
      let matchesFilter = true;
      if (selectedFilter !== "all" && filterOptions) {
        const opt = filterOptions.find((o) => o.value === selectedFilter);
        if (opt) {
          matchesFilter = opt.filterFn(item);
        }
      }

      return matchesSearch && matchesFilter;
    });
  }, [data, searchQuery, searchKey, selectedFilter, filterOptions]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="w-full rounded-2xl border border-[#E9EAF2] bg-white shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-[#E9EAF2] bg-white">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-[#E9EAF2] bg-[#F7F8FC] pl-9 pr-3.5 py-2 text-xs font-medium text-[#1B1F3B] placeholder-gray-400 outline-none focus:border-[#6C4BFF] focus:bg-white transition-all"
          />
        </div>

        {filterOptions && filterOptions.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => {
                  setSelectedFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === "all"
                    ? "bg-[#6C4BFF] text-white"
                    : "bg-[#F7F8FC] text-gray-600 hover:bg-gray-100"
                }`}
              >
                All ({data.length})
              </button>
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedFilter(opt.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedFilter === opt.value
                      ? "bg-[#6C4BFF] text-white"
                      : "bg-[#F7F8FC] text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9EAF2] bg-[#F7F8FC]/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {columns.map((col) => (
                <th key={col.key} className="py-3 px-4">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9EAF2] text-xs">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={item.id ?? rowIdx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-[#F0EDFF]/30" : "hover:bg-[#F7F8FC]/60"
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-3.5 px-4 text-[#1B1F3B] font-medium">
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between border-t border-[#E9EAF2] bg-[#F7F8FC]/40 px-4 py-3 text-xs text-gray-500">
        <div>
          Showing{" "}
          <span className="font-semibold text-[#1B1F3B]">
            {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-[#1B1F3B]">
            {Math.min(currentPage * pageSize, filteredData.length)}
          </span>{" "}
          of <span className="font-semibold text-[#1B1F3B]">{filteredData.length}</span> results
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-[#E9EAF2] bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#6C4BFF] transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-bold text-[#1B1F3B]">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-[#E9EAF2] bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#6C4BFF] transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
