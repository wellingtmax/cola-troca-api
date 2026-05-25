import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

import { CreateTradeDto } from './dto/create-trade.dto';
import { CounterTradeDto } from './dto/counter-trade.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TradeService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
    private readonly notificationService: NotificationService,
  ) { }

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
    const sender = await this.prisma.user.findUnique({
      where: {
        id: senderId,
      },
      select: {
        nickname: true,
        name: true,
      },
    });

    await this.notificationService.create(
      receiver.id,
      'TRADE_RECEIVED',
      'Nova proposta de troca',
      `${sender?.nickname || sender?.name || 'Um colecionador'} enviou uma proposta de troca para você.`,
      '/trocas',
    );

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
              name: true,
              nickname: true,
              avatarUrl: true,
              tradeCode: true,
            },
          },

          receiver: {
            select: {
              id: true,
              name: true,
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

  async acceptTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: {
        id: tradeId,
        senderId: userId,
        status: 'COUNTERED',
      },
      include: {
        items: true,
      },
    });

    if (!trade) {
      throw new BadRequestException(
        'Troca não encontrada ou ainda não recebeu contraproposta.',
      );
    }

    await this.completeTrade(trade.id);

    const updated = await this.prisma.trade.update({
      where: {
        id: trade.id,
      },
      data: {
        status: 'ACCEPTED',
        senderAccepted: true,
        receiverAccepted: true,
      },
      include: {
        items: true,
      },
    });

    const notifyUserId =
      trade.senderId === userId
        ? trade.receiverId
        : trade.senderId;

    await this.notificationService.create(
      notifyUserId,
      'TRADE_ACCEPTED',
      'Troca aceita',
      'Uma proposta de troca foi aceita.',
      '/trocas',
    );

    return this.alertService.success(
      'Troca aceita e concluída com sucesso.',
      updated,
    );
  }

  private async completeTrade(tradeId: string) {
    const trade = await this.prisma.trade.findUnique({
      where: {
        id: tradeId,
      },
      include: {
        items: {
          include: {
            userSticker: true,
          },
        },
      },
    });

    if (!trade) {
      throw new BadRequestException('Troca não encontrada.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of trade.items) {
        const ownerSticker = await tx.userSticker.findFirst({
          where: {
            id: item.userStickerId,
            userId: item.fromUserId,
          },
        });

        if (!ownerSticker) {
          throw new BadRequestException(
            'Uma das figurinhas não pertence mais ao colecionador.',
          );
        }

        if (ownerSticker.quantityDuplicate <= 0) {
          throw new BadRequestException(
            'Uma das figurinhas não possui repetida disponível.',
          );
        }

        await tx.userSticker.update({
          where: {
            id: ownerSticker.id,
          },
          data: {
            quantityOwned: {
              decrement: 1,
            },
            quantityDuplicate: {
              decrement: 1,
            },
          },
        });

        const receiverSticker = await tx.userSticker.findUnique({
          where: {
            userId_stickerId: {
              userId: item.toUserId,
              stickerId: ownerSticker.stickerId,
            },
          },
        });

        if (receiverSticker) {
          await tx.userSticker.update({
            where: {
              id: receiverSticker.id,
            },
            data: {
              quantityOwned: {
                increment: 1,
              },
              quantityDuplicate: {
                increment: receiverSticker.isPlaced ? 0 : 1,
              },
            },
          });
        } else {
          await tx.userSticker.create({
            data: {
              userId: item.toUserId,
              stickerId: ownerSticker.stickerId,
              albumId: ownerSticker.albumId,
              quantityOwned: 1,
              quantityDuplicate: 0,
              isPlaced: false,
              favorite: false,
            },
          });
        }
      }
    });
  }

  async rejectTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: {
        id: tradeId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!trade) {
      throw new BadRequestException('Troca não encontrada.');
    }

    const updated = await this.prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: 'REJECTED',
      },
    });

    const notifyUserId =
      trade.senderId === userId
        ? trade.receiverId
        : trade.senderId;

    await this.notificationService.create(
      notifyUserId,
      'TRADE_REJECTED',
      'Troca recusada',
      'Uma proposta de troca foi recusada.',
      '/trocas',
    );

    return this.alertService.success('Troca rejeitada.', updated);
  }

  async cancelTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: {
        id: tradeId,
        senderId: userId,
        status: 'PENDING',
      },
    });

    if (!trade) {
      throw new BadRequestException('Troca não encontrada.');
    }

    const updated = await this.prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: 'CANCELED',
      },
    });

    const notifyUserId =
      trade.senderId === userId
        ? trade.receiverId
        : trade.senderId;

    await this.notificationService.create(
      notifyUserId,
      'TRADE_REJECTED',
      'Troca cancelada',
      'Uma proposta de troca foi cancelada.',
      '/trocas',
    );

    return this.alertService.success('Troca cancelada.', updated);
  }

  async counterTrade(
    userId: string,
    tradeId: string,
    dto: CounterTradeDto,
  ) {
    const trade = await this.prisma.trade.findFirst({
      where: {
        id: tradeId,
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        items: true,
      },
    });

    if (!trade) {
      throw new BadRequestException('Troca não encontrada.');
    }

    const userStickers = await this.prisma.userSticker.findMany({
      where: {
        id: {
          in: dto.counterStickerIds,
        },

        userId,
        quantityDuplicate: {
          gt: 0,
        },
      },
    });

    if (userStickers.length !== dto.counterStickerIds.length) {
      throw new BadRequestException(
        'Uma ou mais figurinhas não estão disponiveis para troca.',
      );
    }

    await this.prisma.tradeItem.createMany({
      data: dto.counterStickerIds.map((userStickerId) => ({
        tradeId,
        userStickerId,
        fromUserId: userId,
        toUserId: trade.senderId,
      })),
    });

    const updated = await this.prisma.trade.update({
      where: {
        id: tradeId,
      },

      data: {
        status: 'COUNTERED',
        receiverAccepted: true,
        senderAccepted: false,
      },

      include: {
        items: true,
      },
    });

    const tradeNotification = await this.prisma.trade.findUnique({
      where: {
        id: tradeId,
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            name: true,
          },
        },
      },
    });

    if (tradeNotification) {
      const notifyUserId =
        tradeNotification.senderId === userId
          ? tradeNotification.receiverId
          : tradeNotification.senderId;

      const currentUser =
        tradeNotification.senderId === userId
          ? tradeNotification.sender
          : tradeNotification.receiver;

      await this.notificationService.create(
        notifyUserId,
        'TRADE_RECEIVED',
        'Nova contraproposta',
        `${currentUser?.nickname || currentUser?.name || 'Um colecionador'} enviou uma contraproposta.`,
        '/trocas',
      );
    }

    return this.alertService.success(
      'Contraproposta enviada com sucesso.',
      updated,
    );
  }

}