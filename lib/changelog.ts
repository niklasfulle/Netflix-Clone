import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { APP_VERSION } from '@/lib/version';

export interface ChangelogEntry {
  version: string;
  changes: string[];
}

export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | undefined;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    const versionMatch = /^##\s+(?:\[current\]|(\d+(?:\.\d+)*))$/i.exec(line);

    if (versionMatch) {
      currentEntry = {
        version: versionMatch[1] ?? APP_VERSION,
        changes: [],
      };
      entries.push(currentEntry);
      continue;
    }

    const changeMatch = /^-\s+(.+)$/.exec(line);
    if (changeMatch && currentEntry) {
      currentEntry.changes.push(changeMatch[1]);
    }
  }

  return entries;
}

export function getChangelog(): ChangelogEntry[] {
  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  return parseChangelog(readFileSync(changelogPath, 'utf8'));
}
