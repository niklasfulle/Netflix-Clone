import { cleanupTempFolders } from "./cleanup-temp";
import path from "node:path";

try {
  // Passe die Pfade ggf. an dein Projekt an
  const baseFolders = [
    path.resolve(__dirname, "../movies"),
    path.resolve(__dirname, "../series")
  ];
  const maxAgeMinutes = 1; // Für Test: lösche alles älter als 1 Minute

  const deleted = await cleanupTempFolders({ baseFolders, maxAgeMinutes });
  if (deleted.length === 0) {
    console.log("Keine alten temp-Dateien gefunden.");
  } else {
    console.log("Gelöschte temp-Dateien:", deleted);
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
