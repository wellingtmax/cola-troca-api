import { PrismaClient, StickerRarity } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'M@x94125',
  database: 'cola_troca',
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({
  adapter,
});

const albums = [
  {
    themeName: 'Anime Legends',
    prefix: 'Herói Anime',
    prompt: 'anime hero original character',
  },
  {
    themeName: 'Cyber Fighters',
    prefix: 'Guerreiro Cyber',
    prompt: 'cyberpunk armored warrior original character',
  },
  {
    themeName: 'Monster Battle',
    prefix: 'Monstro Lendário',
    prompt: 'fantasy monster original creature',
  },
  {
    themeName: 'Super Heroes Universe',
    prefix: 'Super Herói',
    prompt: 'original superhero character',
  },
  {
    themeName: 'Fantasy Kingdoms',
    prefix: 'Reino Fantasia',
    prompt: 'fantasy knight mage dragon original character',
  },
  {
    themeName: 'Space Warriors',
    prefix: 'Guerreiro Espacial',
    prompt: 'sci fi space warrior original character',
  },
  {
    themeName: 'Magic Academy',
    prefix: 'Aluno Mágico',
    prompt: 'magic academy wizard student original character',
  },
  {
    themeName: 'Soccer Stars 2026',
    prefix: 'Craque Futuro',
    prompt: 'fictional soccer player original character',
  },
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

function getImageUrl(prompt: string, number: number) {
  return `https://picsum.photos/seed/cola-troca-${number}/512/768`;
}

async function main() {
  for (const albumData of albums) {
    const album = await prisma.album.findFirst({
      where: {
        themeName: albumData.themeName,
      },
    });

    if (!album) {
      console.log(`Álbum não encontrado: ${albumData.themeName}`);
      continue;
    }

    for (let number = 1; number <= 100; number++) {
      const rarity = getRarity(number);

      const imageUrl = getImageUrl(
        albumData.prompt,
        number,
      );

      await prisma.sticker.upsert({
        where: {
          albumId_number: {
            albumId: album.id,
            number,
          },
        },

        update: {
          name: `${albumData.prefix} ${number}`,
          rarity,
          imageUrl,
          isSpecial:
            rarity === StickerRarity.EPIC ||
            rarity === StickerRarity.LEGENDARY,
        },

        create: {
          albumId: album.id,
          number,
          name: `${albumData.prefix} ${number}`,
          rarity,
          imageUrl,
          isSpecial:
            rarity === StickerRarity.EPIC ||
            rarity === StickerRarity.LEGENDARY,
        },
      });
    }

    console.log(`100 figurinhas atualizadas para: ${albumData.themeName}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();

    console.log('Seed finalizado com sucesso!');
  })
  .catch(async (error) => {
    console.error(error);

    await prisma.$disconnect();
  });