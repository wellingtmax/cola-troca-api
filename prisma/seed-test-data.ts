import { PrismaClient, StickerRarity } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'cola_troca',
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

const albums = [
  ['Anime Legends', 'Herói Anime', 'https://picsum.photos/seed/anime-legends/1200/700'],
  ['Cyber Fighters', 'Guerreiro Cyber', 'https://picsum.photos/seed/cyber-fighters/1200/700'],
  ['Monster Battle', 'Monstro Lendário', 'https://picsum.photos/seed/monster-battle/1200/700'],
  ['Super Heroes Universe', 'Super Herói', 'https://picsum.photos/seed/super-heroes/1200/700'],
  ['Fantasy Kingdoms', 'Reino Fantasia', 'https://picsum.photos/seed/fantasy-kingdoms/1200/700'],
  ['Space Warriors', 'Guerreiro Espacial', 'https://picsum.photos/seed/space-warriors/1200/700'],
  ['Magic Academy', 'Aluno Mágico', 'https://picsum.photos/seed/magic-academy/1200/700'],
  ['Soccer Stars 2026', 'Craque Futuro', 'https://picsum.photos/seed/soccer-stars/1200/700'],
  ['Drama Novelas', 'Astro Dramático', 'https://picsum.photos/seed/drama-novelas/1200/700'],
  ['Racing Legends', 'Piloto Lendário', 'https://picsum.photos/seed/racing-legends/1200/700'],
];

function getRarity(number: number): StickerRarity {
  if (number <= 70) return StickerRarity.COMMON;
  if (number <= 90) return StickerRarity.RARE;
  if (number <= 98) return StickerRarity.EPIC;
  return StickerRarity.LEGENDARY;
}

async function main() {
  for (let i = 0; i < albums.length; i++) {
    const [themeName, prefix, coverUrl] = albums[i];

    let album = await prisma.album.findFirst({
      where: { themeName },
    });

    if (!album) {
      album = await prisma.album.create({
        data: {
          themeName,
          coverUrl,
          price: 29.9 + i * 5,
          releaseDate: new Date(),
        },
      });
    } else {
      album = await prisma.album.update({
        where: { id: album.id },
        data: {
          coverUrl,
          price: 29.9 + i * 5,
        },
      });
    }

    for (let number = 1; number <= 100; number++) {
      const rarity = getRarity(number);
      const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(themeName)}-${number}/512/768`;

      await prisma.sticker.upsert({
        where: {
          albumId_number: {
            albumId: album.id,
            number,
          },
        },
        update: {
          name: `${prefix} ${number}`,
          rarity,
          imageUrl,
          isSpecial: rarity === StickerRarity.EPIC || rarity === StickerRarity.LEGENDARY,
        },
        create: {
          albumId: album.id,
          number,
          name: `${prefix} ${number}`,
          rarity,
          imageUrl,
          isSpecial: rarity === StickerRarity.EPIC || rarity === StickerRarity.LEGENDARY,
        },
      });
    }

    console.log(`Álbum criado/atualizado: ${themeName} com 100 figurinhas`);
  }

  console.log('Seed concluído!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
  });