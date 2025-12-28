import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'backend.log');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const logContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    let logs = logContent.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
    logs = logs.reverse(); // Neueste zuerst, wie bisher im Frontend
    const total = logs.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginatedLogs = logs.slice((page - 1) * pageSize, page * pageSize);
    return NextResponse.json({ logs: paginatedLogs, total, page, pageSize, totalPages });
  } catch (e) {
    return NextResponse.json({ error: 'Could not read log file.' }, { status: 500 });
  }
}
