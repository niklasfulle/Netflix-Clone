import { NextRequest, NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { backendLogStore } from "@/lib/log-store";

function stringifyCsvValue(value: unknown): string {
  switch (typeof value) {
    case "undefined":
      return "";
    case "object":
      return value === null ? "" : JSON.stringify(value) ?? "";
    case "string":
      return value;
    case "number":
    case "bigint":
      return value.toString();
    case "boolean":
      return value ? "true" : "false";
    case "symbol":
      return value.description ?? "";
    case "function":
      return value.name;
  }
}

function csvCell(value: unknown) {
  return `"${stringifyCsvValue(value).replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest | Request = new NextRequest("http://localhost/api/logs")) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const searchParams = request instanceof NextRequest ? request.nextUrl.searchParams : new URL(request.url).searchParams;
  const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
  const pageSize = Math.min(Math.max(Number.parseInt(searchParams.get("pageSize") || "20", 10), 1), 100);
  const level = searchParams.get("level") || "all";
  const search = searchParams.get("search")?.trim().toLocaleLowerCase("de") || "";
  const action = searchParams.get("action")?.trim().toLocaleLowerCase("de") || "";
  const userId = searchParams.get("userId")?.trim().toLocaleLowerCase("de") || "";
  const from = searchParams.get("from") ? new Date(searchParams.get("from") as string) : null;
  const to = searchParams.get("to") ? new Date(`${searchParams.get("to")}T23:59:59.999`) : null;
  const query = { page, pageSize, level, search, action, userId, from, to };

  if (searchParams.get("format") === "csv") {
    const encoder = new TextEncoder();
    const iterator = backendLogStore.iterate(query);
    let headerSent = false;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (!headerSent) {
          controller.enqueue(encoder.encode(`${["timestamp", "level", "action", "userId", "details"].map(csvCell).join(";")}\n`));
          headerSent = true;
        }
        const next = await iterator.next();
        if (next.done) {
          controller.close();
          return;
        }
        const log = next.value;
        controller.enqueue(encoder.encode(`${[log.timestamp, log.level, log.action, log.userId, JSON.stringify(log)].map(csvCell).join(";")}\n`));
      },
      async cancel() {
        await iterator.return(undefined);
      },
    });
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="system-logs.csv"',
      },
    });
  }

  const result = await backendLogStore.query(query);

  return NextResponse.json({
    logs: result.logs,
    total: result.total,
    page,
    pageSize,
    totalPages: Math.ceil(result.total / pageSize),
    counts: result.counts,
  });
}
