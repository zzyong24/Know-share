import type { EndpointFieldRow } from "@/mocks/fixtures/open-api";

/*
  COMP-196 EndpointFieldTable（端点字段说明表）。紧凑表：字段 / 类型 / 来源 / 追溯。
  逐字段可追溯 data-contract 必需/推荐字段或标「派生」（PAGE-090 验收 4）。
  contact 不出现在任何公开读字段表（INV-03 收紧 / ASM-055）—— 由 fixtures 保证不含。
  表头 <th scope="col"> 关联（NFR-007）；窄屏整体横向滚动。
*/
export interface EndpointFieldTableProps {
  rows: EndpointFieldRow[];
  kind?: "response" | "request";
}

export function EndpointFieldTable({
  rows,
  kind = "response",
}: EndpointFieldTableProps) {
  const caption = kind === "request" ? "请求字段说明" : "响应字段说明";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-text-muted">
            <th scope="col" className="py-1.5 pr-3 font-medium">
              字段
            </th>
            <th scope="col" className="py-1.5 pr-3 font-medium">
              类型
            </th>
            <th scope="col" className="py-1.5 pr-3 font-medium">
              来源
            </th>
            <th scope="col" className="py-1.5 font-medium">
              追溯
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.field} className="border-b border-border/60 align-top">
              <td className="py-1.5 pr-3 font-mono text-text">{row.field}</td>
              <td className="py-1.5 pr-3 text-text-muted">{row.type}</td>
              <td className="py-1.5 pr-3 text-text-muted">{row.source}</td>
              <td className="py-1.5 text-text-muted">
                {row.trace}
                {row.note && (
                  <span className="block text-text-subtle">{row.note}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
