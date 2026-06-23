"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Icon } from "./icon";
import { SkeletonBlock } from "./skeleton-block";
import { cn } from "@/lib/utils";

/*
  COMP-015 DataTable（紧凑数据表）。表头 scope/aria-sort；行操作真实按钮带行上下文 label；
  空态渲染 emptyState；loading 行 Skeleton。取数由 props 注入（ASM-068）。
  风险/状态列请用 StatusPill 渲染（非仅颜色）。
*/
export interface ColumnDef<Row> {
  id: string;
  header: string;
  cell: (row: Row) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
}

export interface RowAction<Row> {
  key: string;
  label: (row: Row) => string;
  icon?: string;
  onClick: (row: Row) => void;
}

export interface DataTableProps<Row> {
  columns: ColumnDef<Row>[];
  data: Row[];
  getRowId: (row: Row) => string;
  sorting?: { columnId: string; dir: "asc" | "desc" };
  onSort?: (columnId: string, dir: "asc" | "desc") => void;
  onRowClick?: (row: Row) => void;
  rowActions?: RowAction<Row>[];
  density?: "compact" | "comfortable";
  loading?: boolean;
  emptyState?: React.ReactNode;
  caption?: string;
}

export function DataTable<Row>({
  columns,
  data,
  getRowId,
  sorting,
  onSort,
  onRowClick,
  rowActions,
  density = "compact",
  loading = false,
  emptyState,
  caption,
}: DataTableProps<Row>) {
  if (loading) {
    return <SkeletonBlock variant="row" count={4} />;
  }
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const ariaSort = (colId: string): "ascending" | "descending" | "none" => {
    if (sorting?.columnId !== colId) return "none";
    return sorting.dir === "asc" ? "ascending" : "descending";
  };

  const toggleSort = (colId: string) => {
    const next = sorting?.columnId === colId && sorting.dir === "asc" ? "desc" : "asc";
    onSort?.(colId, next);
  };

  return (
    <Table className="text-sm">
      {caption && <caption className="sr-only">{caption}</caption>}
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.id}
              scope="col"
              aria-sort={col.sortable ? ariaSort(col.id) : undefined}
              className={cn(
                col.align === "right" && "text-right",
                col.align === "center" && "text-center"
              )}
            >
              {col.sortable && onSort ? (
                <button
                  type="button"
                  onClick={() => toggleSort(col.id)}
                  className="inline-flex items-center gap-1 font-medium hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
                >
                  {col.header}
                  <Icon
                    name={
                      sorting?.columnId === col.id && sorting.dir === "desc"
                        ? "expand_less"
                        : "expand_more"
                    }
                    size={14}
                    aria-hidden
                  />
                </button>
              ) : (
                col.header
              )}
            </TableHead>
          ))}
          {rowActions && rowActions.length > 0 && (
            <TableHead scope="col" className="text-right">
              操作
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={getRowId(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              density === "comfortable" ? "[&>td]:py-3" : "[&>td]:py-2",
              onRowClick && "cursor-pointer"
            )}
          >
            {columns.map((col) => (
              <TableCell
                key={col.id}
                className={cn(
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center"
                )}
              >
                {col.cell(row)}
              </TableCell>
            ))}
            {rowActions && rowActions.length > 0 && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {rowActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      aria-label={action.label(row)}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(row);
                      }}
                      className="rounded p-1 text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      {action.icon ? (
                        <Icon name={action.icon} size={16} aria-hidden />
                      ) : (
                        action.label(row)
                      )}
                    </button>
                  ))}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
