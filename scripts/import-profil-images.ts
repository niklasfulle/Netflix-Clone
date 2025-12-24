
import { PrismaClient } from '@prisma/client';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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
      if (!exists) {
        await prisma.profilImg.create({
          data: { url: fileName },
        });
        console.log(`Added: ${fileName}`);
      } else {
        console.log(`Already exists: ${fileName}`);
      }
    } catch (err) {
      console.error(`Fehler bei ${fileName}:`, err);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
