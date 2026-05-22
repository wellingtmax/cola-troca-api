import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

import { CreateTradeDto } from './dto/create-trade.dto';

@Injectable()
export class TradeService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) {}

  async createTrade(
    senderId: string,
    dto: CreateTradeDto,
  ) {

    const receiver =
      await this.prisma.user.findUnique({
        where: {
          tradeCode: dto.receiverTradeCode,
        },
      });

    if (!receiver) {
      throw new BadRequestException(
        'Usuário não encontrado.',
      );
    }

    if (receiver.id === senderId) {
      throw new BadRequestException(
        'Você não pode trocar com você mesmo.',
      );
    }

    const trade =
      await this.prisma.trade.create({
        data: {

          senderId,

          receiverId: receiver.id,

          items: {
            create: [

              ...dto.offeredStickerIds.map(
                (stickerId) => ({
                  userStickerId: stickerId,
                  fromUserId: senderId,
                  toUserId: receiver.id,
                }),
              ),

              ...dto.requestedStickerIds.map(
                (stickerId) => ({
                  userStickerId: stickerId,
                  fromUserId: receiver.id,
                  toUserId: senderId,
                }),
              ),
            ],
          },
        },

        include: {
          items: true,
        },
      });

    return this.alertService.success(
      'Troca criada com sucesso.',
      trade,
    );
  }

  async findMyTrades(userId: string) {

    const trades =
      await this.prisma.trade.findMany({

        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },

        include: {

          sender: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
              tradeCode: true,
            },
          },

          receiver: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
              tradeCode: true,
            },
          },

          items: {
            include: {
              userSticker: {
                include: {
                  sticker: true,
                  album: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return this.alertService.success(
      'Trocas encontradas.',
      trades,
    );
  }

  async findUserByTradeCode(tradeCode: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      tradeCode,
    },
    select: {
      id: true,
      name: true,
      nickname: true,
      avatarUrl: true,
      tradeCode: true,
    },
  });

  if (!user) {
    throw new BadRequestException('Colecionador não encontrado.');
  }

  return this.alertService.success(
    'Colecionador encontrado.',
    user,
  );
}
}