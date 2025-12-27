import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'backend.log');

export async function GET(req: NextRequest) {
  try {
    const logContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    // Return as array of log entries (one per line)
    const logs = logContent.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
    return NextResponse.json({ logs });
  } catch (e) {
    return NextResponse.json({ error: 'Could not read log file.' }, { status: 500 });
  }
}
