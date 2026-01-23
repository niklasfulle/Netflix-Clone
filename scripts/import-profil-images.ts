
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const prisma = new PrismaClient();

async function main() {
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'profil');
  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    const fileName = file;
    const filePath = path.join(imagesDir, file);
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      if (metadata.width !== 200 || metadata.height !== 200) {
        console.error(`Error: ${fileName} ist ${metadata.width}x${metadata.height} (nicht 200x200)`);
        continue;
      }
      // Prüfen, ob bereits vorhanden
      const exists = await prisma.profilImg.findFirst({ where: { url: fileName } });
      if (exists) {
        console.log(`Already exists: ${fileName}`);
      } else {
        await prisma.profilImg.create({
          data: { url: fileName },
        });
        console.log(`Added: ${fileName}`);
      }
    } catch (err) {
      console.error(`Fehler bei ${fileName}:`, err);
    }
  }
}

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
