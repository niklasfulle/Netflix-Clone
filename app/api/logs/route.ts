import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";

const LOG_FILE_PATH = path.join(process.cwd(), "logs", "backend.log");

type LogRecord = {
  timestamp?: string;
  action?: string;
  userId?: string;
  level?: string;
  raw?: string;
  [key: string]: unknown;
};

function readLogs(): LogRecord[] {
  if (!fs.existsSync(LOG_FILE_PATH)) return [];
  try {
    const content = fs.readFileSync(LOG_FILE_PATH, "utf8").trim();
    if (!content) return [];
    return content.split("\n").map((line) => {
      try {
        return JSON.parse(line) as LogRecord;
      } catch {
        return { level: "unknown", raw: line };
      }
    }).reverse();
  } catch {
    return [];
  }
}

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

  const allLogs = readLogs();
  const counts = allLogs.reduce((result, log) => {
    const key = log.level === "warning" ? "warn" : log.level || "unknown";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {} as Record<string, number>);
  const logs = allLogs.filter((log) => {
    const normalizedLevel = log.level === "warning" ? "warn" : log.level;
    const timestamp = log.timestamp ? new Date(log.timestamp) : null;
    if (level !== "all" && normalizedLevel !== level) return false;
    if (action && !String(log.action || "").toLocaleLowerCase("de").includes(action)) return false;
    if (userId && !String(log.userId || "").toLocaleLowerCase("de").includes(userId)) return false;
    if (search && !JSON.stringify(log).toLocaleLowerCase("de").includes(search)) return false;
    if (from && timestamp && timestamp < from) return false;
    if (to && timestamp && timestamp > to) return false;
    return true;
  });

  if (searchParams.get("format") === "csv") {
    const header = ["timestamp", "level", "action", "userId", "details"].map(csvCell).join(";");
    const rows = logs.map((log) => [log.timestamp, log.level, log.action, log.userId, JSON.stringify(log)].map(csvCell).join(";"));
    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="system-logs.csv"',
      },
    });
  }

  return NextResponse.json({
    logs: logs.slice((page - 1) * pageSize, page * pageSize),
    total: logs.length,
    page,
    pageSize,
    totalPages: Math.ceil(logs.length / pageSize),
    counts,
  });
}
