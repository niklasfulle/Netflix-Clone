import fs from "node:fs";
import path from "node:path";

// Löscht alte Dateien im temp-Ordner, die älter als X Minuten sind
export async function cleanupTempFolders({
  baseFolders = [],
  maxAgeMinutes = 60
}: {
  baseFolders: string[];
  maxAgeMinutes?: number;
}) {
  const now = Date.now();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  let deletedFiles: string[] = [];

  for (const baseFolder of baseFolders) {
    const tempFolder = path.join(baseFolder, "temp");
    if (!fs.existsSync(tempFolder)) continue;
    const files = fs.readdirSync(tempFolder);
    for (const file of files) {
      const filePath = path.join(tempFolder, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        deletedFiles.push(filePath);
      }
    }
  }
  return deletedFiles;
}

// Beispiel-Aufruf (kann als Script oder API genutzt werden):
// cleanupTempFolders({ baseFolders: ["./movies", "./series"], maxAgeMinutes: 60 });
