import 'dotenv/config';

import {
  PrismaClient,
  StickerRarity,
  PackType,
} from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const albums = [
  [
    'Anime Legends',
    'Herói Anime',
    'https://picsum.photos/seed/anime-legends/1200/700',
    'Anime Cards',
    'Anime',
  ],
  [
    'Cyber Fighters',
    'Guerreiro Cyber',
    'https://picsum.photos/seed/cyber-fighters/1200/700',
    'Cyber Studio',
    'Ficção Científica',
  ],
  [
    'Monster Battle',
    'Monstro Lendário',
    'https://picsum.photos/seed/monster-battle/1200/700',
    'Fantasy Stickers',
    'Fantasia',
  ],
  [
    'Super Heroes Universe',
    'Super Herói',
    'https://picsum.photos/seed/super-heroes/1200/700',
    'Hero Collection',
    'Super-Heróis',
  ],
  [
    'Fantasy Kingdoms',
    'Reino Fantasia',
    'https://picsum.photos/seed/fantasy-kingdoms/1200/700',
    'Fantasy Stickers',
    'Fantasia',
  ],
  [
    'Space Warriors',
    'Guerreiro Espacial',
    'https://picsum.photos/seed/space-warriors/1200/700',
    'Space Cards',
    'Ficção Científica',
  ],
  [
    'Magic Academy',
    'Aluno Mágico',
    'https://picsum.photos/seed/magic-academy/1200/700',
    'Magic Cards',
    'Magia',
  ],
  [
    'Soccer Stars 2026',
    'Craque Futuro',
    'https://picsum.photos/seed/soccer-stars/1200/700',
    'Cola&Troca',
    'Futebol',
  ],
  [
    'Drama Novelas',
    'Astro Dramático',
    'https://picsum.photos/seed/drama-novelas/1200/700',
    'Drama Cards',
    'Novelas',
  ],
  [
    'Racing Legends',
    'Piloto Lendário',
    'https://picsum.photos/seed/racing-legends/1200/700',
    'Speed Cards',
    'Corrida',
  ],
];

function getRarity(number: number): StickerRarity {
  if (number <= 70) {
    return StickerRarity.COMMON;
  }

  if (number <= 90) {
    return StickerRarity.RARE;
  }

  if (number <= 98) {
    return StickerRarity.EPIC;
  }

  return StickerRarity.LEGENDARY;
}

async function seedPacks() {
  const packs = [
    {
      name: 'Pack Diário Gratuito',
      type: PackType.FREE,
      stickerQuantity: 3,
      price: 0,
      commonChance: 100,
      rareChance: 0,
      epicChance: 0,
      legendaryChance: 0,
      guaranteedLegendary: false,
      dailyLimit: true,
    },
    {
      name: 'Pack Pequeno',
      type: PackType.SMALL,
      stickerQuantity: 5,
      price: 50,
      commonChance: 75,
      rareChance: 20,
      epicChance: 5,
      legendaryChance: 0,
      guaranteedLegendary: false,
      dailyLimit: false,
    },
    {
      name: 'Pack Premium',
      type: PackType.MEDIUM,
      stickerQuantity: 8,
      price: 120,
      commonChance: 55,
      rareChance: 30,
      epicChance: 12,
      legendaryChance: 3,
      guaranteedLegendary: false,
      dailyLimit: false,
    },
    {
      name: 'Pack Elite',
      type: PackType.LARGE,
      stickerQuantity: 12,
      price: 250,
      commonChance: 40,
      rareChance: 35,
      epicChance: 20,
      legendaryChance: 5,
      guaranteedLegendary: true,
      dailyLimit: false,
    },
  ];

  for (const pack of packs) {
    await prisma.pack.upsert({
      where: {
        type: pack.type,
      },
      update: pack,
      create: pack,
    });

    console.log(`Pack criado/atualizado: ${pack.name}`);
  }
}

async function seedAlbumsAndStickers() {
  for (let i = 0; i < albums.length; i++) {
    const [
      themeName,
      prefix,
      coverUrl,
      company,
      category,
    ] = albums[i];

    const album = await prisma.album.upsert({
      where: {
        themeName,
      },
      update: {
        coverUrl,
        price: 300 + i * 50,
        company,
        category,
        collection: 'Seed PostgreSQL',
        isFeatured: i < 4,
        isExclusive: i === 2 || i === 7,
      },
      create: {
        themeName,
        coverUrl,
        price: 300 + i * 50,
        company,
        category,
        collection: 'Seed PostgreSQL',
        isFeatured: i < 4,
        isExclusive: i === 2 || i === 7,
        releaseDate: new Date(),
      },
    });

    for (let number = 1; number <= 100; number++) {
      const rarity = getRarity(number);

      const imageUrl =
        `https://picsum.photos/seed/${encodeURIComponent(themeName)}-${number}/512/768`;

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
          isSpecial:
            rarity === StickerRarity.EPIC ||
            rarity === StickerRarity.LEGENDARY,
        },
        create: {
          albumId: album.id,
          number,
          name: `${prefix} ${number}`,
          rarity,
          imageUrl,
          isSpecial:
            rarity === StickerRarity.EPIC ||
            rarity === StickerRarity.LEGENDARY,
        },
      });
    }

    console.log(
      `Álbum criado/atualizado: ${themeName} com 100 figurinhas`,
    );
  }
}

async function main() {
  await seedPacks();
  await seedAlbumsAndStickers();

  console.log('Seed PostgreSQL concluído com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Erro ao executar seed:', error);

    await prisma.$disconnect();

    process.exit(1);
  });