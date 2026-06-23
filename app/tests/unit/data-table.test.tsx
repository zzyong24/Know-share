import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";

interface Row {
  id: string;
  name: string;
  status: string;
}

const data: Row[] = [
  { id: "r1", name: "交换 A", status: "已完成" },
  { id: "r2", name: "交换 B", status: "已请求" },
];

const columns: ColumnDef<Row>[] = [
  { id: "name", header: "名称", cell: (r) => r.name, sortable: true },
  { id: "status", header: "状态", cell: (r) => r.status },
];

/*
  COMP-015 DataTable 测试：表头 scope/aria-sort；排序触发 onSort；行操作带行上下文 label；空态渲染。
*/
describe("DataTable（COMP-015）", () => {
  it("渲染行数据与表头 scope", () => {
    render(<DataTable columns={columns} data={data} getRowId={(r) => r.id} />);
    expect(screen.getByText("交换 A")).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]).toHaveAttribute("scope", "col");
  });

  it("可排序列含 aria-sort，点击触发 onSort", async () => {
    const onSort = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        onSort={onSort}
      />
    );
    const nameHeader = screen.getByRole("columnheader", { name: /名称/ });
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
    await userEvent.click(screen.getByRole("button", { name: /名称/ }));
    expect(onSort).toHaveBeenCalledWith("name", "asc");
  });

  it("行操作按钮带行上下文 label", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        rowActions={[
          {
            key: "view",
            label: (r) => `查看 ${r.name}`,
            icon: "open_in_new",
            onClick: () => {},
          },
        ]}
      />
    );
    expect(screen.getByRole("button", { name: "查看 交换 A" })).toBeInTheDocument();
  });

  it("空数据渲染 emptyState", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(r) => r.id}
        emptyState={<div>暂无交换记录</div>}
      />
    );
    expect(screen.getByText("暂无交换记录")).toBeInTheDocument();
  });
});
