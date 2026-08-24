#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_DATA_AGE_DAYS = 60;
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(projectRoot, 'package.json');
const installedManifestPath = join(
  projectRoot,
  'node_modules',
  'baseline-browser-mapping',
  'package.json',
);

try {
  const [manifest, installedManifest] = await Promise.all([
    readJson(manifestPath),
    readJson(installedManifestPath),
  ]);

  if (manifest.devDependencies?.['baseline-browser-mapping']) {
    await checkPublishedAge(installedManifest.version);
  } else {
    fail(
      'baseline-browser-mapping ist keine direkte Dev-Abhängigkeit. Führe "yarn baseline:update" aus.',
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  fail(`Baseline-Browserdaten konnten nicht geprüft werden: ${message}`);
}

async function checkPublishedAge(installedVersion) {
  let registryMetadata;
  try {
    const response = await fetch('https://registry.npmjs.org/baseline-browser-mapping', {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`npm-Registry antwortete mit HTTP ${response.status}`);
    }
    registryMetadata = await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Warnung: Alter der Baseline-Browserdaten konnte nicht online geprüft werden (${message}).`,
    );
    console.warn(`Installierte Version: ${installedVersion}. Der Sonar-Scan wird fortgesetzt.`);
    return;
  }

  const publishedAt = registryMetadata.time?.[installedVersion];
  if (!publishedAt) {
    fail(
      `Für die installierte Version ${installedVersion} wurde kein Veröffentlichungsdatum gefunden. Führe "yarn baseline:update" aus.`,
    );
    return;
  }

  const ageInDays = Math.floor((Date.now() - Date.parse(publishedAt)) / 86_400_000);
  const latestVersion = registryMetadata['dist-tags']?.latest;
  if (ageInDays > MAX_DATA_AGE_DAYS) {
    const latestVersionHint = latestVersion ? ` (aktuell: ${latestVersion})` : '';
    fail(
      `Baseline-Browserdaten ${installedVersion} sind ${ageInDays} Tage alt${latestVersionHint}. Führe "yarn baseline:update" aus.`,
    );
    return;
  }

  const latestHint = latestVersion && latestVersion !== installedVersion
    ? `; aktuell verfügbar: ${latestVersion}`
    : '';
  console.log(
    `Baseline-Browserdaten: ${installedVersion}, ${ageInDays} Tage alt${latestHint} – verwendbar.`,
  );
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}
