"use client";

import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { TableShell, tdClass, thClass } from "@/components/ui/page";

export type ClientTableItem = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  projectCount: number;
  status: string;
  createdAt: string;
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, ClientTableItem>();
const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Client",
    cell: ({ getValue, row }) => (
      <Link
        className="hover:text-primary font-medium"
        href={`/clients/${row.original.id}`}
      >
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("company", {
    header: "Company",
    cell: ({ getValue }) => getValue() ?? "—",
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => getValue() ?? "—",
  }),
  columnHelper.accessor("projectCount", { header: "Projects" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <Badge value={getValue()} />,
  }),
  columnHelper.accessor("createdAt", { header: "Created" }),
]);

export function ClientTable({ clients }: { clients: ClientTableItem[] }) {
  const table = useTable({ features, columns, data: clients });

  return (
    <TableShell>
      <table className="w-full">
        <caption className="sr-only">Clients in this workspace</caption>
        <thead className="bg-muted/60">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className={thClass}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30">
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className={tdClass}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}
