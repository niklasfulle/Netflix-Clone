import { NextRequest, NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { containerLogStore, type ContainerLogEntry } from "@/lib/container-log-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvCell(value: unknown) {
  const scalar = typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : "";
  return `"${scalar.replaceAll('"', '""')}"`;
}

function parseQuery(request: NextRequest | Request) {
  const searchParams = request instanceof NextRequest
    ? request.nextUrl.searchParams
    : new URL(request.url).searchParams;
  const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
  const pageSize = Math.min(Math.max(Number.parseInt(searchParams.get("pageSize") || "20", 10), 1), 100);
  return {
    searchParams,
    query: {
      page,
      pageSize,
      level: searchParams.get("level") || "all",
      search: searchParams.get("search")?.trim() || "",
      from: searchParams.get("from") ? new Date(searchParams.get("from") as string) : null,
      to: searchParams.get("to") ? new Date(`${searchParams.get("to")}T23:59:59.999`) : null,
    },
  };
}

export async function GET(request: NextRequest | Request = new NextRequest("http://localhost/api/admin/container-logs")) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams, query } = parseQuery(request);
  if (searchParams.get("format") === "csv") {
    const entries = await containerLogStore.iterate(query);
    const rows = [
      ["timestamp", "level", "message"],
      ...entries.map((entry: ContainerLogEntry) => [entry.timestamp, entry.level, entry.message]),
    ];
    return new NextResponse(`${rows.map((row) => row.map(csvCell).join(";")).join("\n")}\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="container-logs.csv"',
        "Cache-Control": "no-store",
      },
    });
  }

  const result = await containerLogStore.query(query);
  return NextResponse.json({ ...result, source: "container" }, {
    headers: { "Cache-Control": "no-store" },
  });
}
