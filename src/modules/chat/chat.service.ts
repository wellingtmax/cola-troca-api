import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';
import { NotificationService } from '../notification/notification.service';

import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
    private readonly notificationService: NotificationService,
  ) {}

  async findGlobalMessages(
    userId: string,
    page = 1,
    limit = 30,
    search?: string,
  ) {
    const currentPage = Math.max(1, page);
    const take = Math.min(Math.max(1, limit), 100);
    const skip = (currentPage - 1) * take;

    const searchTerm = search?.trim();

    const where: any = {
      scope: 'GLOBAL',
      country: 'BR',
      isDeleted: false,
    };

    if (searchTerm) {
      where.OR = [
        {
          content: {
            contains: searchTerm,
          },
        },
        {
          user: {
            nickname: {
              contains: searchTerm,
            },
          },
        },
        {
          user: {
            name: {
              contains: searchTerm,
            },
          },
        },
        {
          user: {
            tradeCode: {
              contains: searchTerm,
            },
          },
        },
      ];
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,

      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatarUrl: true,
            tradeCode: true,
            lastSeenAt: true,
          },
        },

        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                avatarUrl: true,
                lastSeenAt: true,
              },
            },
          },
        },

        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
      },

      orderBy: [
        {
          isPinned: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],

      skip,
      take,
    });

    const total = await this.prisma.chatMessage.count({
      where,
    });

    const formatted = messages.map((message) => ({
      id: message.id,
      content: message.content,
      imageUrl: message.imageUrl,
      isPinned: message.isPinned,
      isEdited: message.isEdited,
      createdAt: message.createdAt,

      user: message.user,

      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            user: message.replyTo.user,
          }
        : null,

      likesCount: message.likes?.length || 0,

      likedByMe:
        message.likes?.some((like) => like.userId === userId) || false,
    }));

    return this.alertService.success(
      'Mensagens encontradas.',
      {
        messages: formatted,

        pagination: {
          page: currentPage,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
          hasMore: currentPage * take < total,
        },
      },
    );
  }

  async createMessage(
    userId: string,
    dto: CreateMessageDto,
  ) {
    const content = dto.content?.trim();

    if (!content) {
      throw new BadRequestException(
        'A mensagem não pode estar vazia.',
      );
    }

    if (dto.replyToId) {
      const replyMessage =
        await this.prisma.chatMessage.findUnique({
          where: {
            id: dto.replyToId,
          },
        });

      if (!replyMessage) {
        throw new NotFoundException(
          'Mensagem respondida não encontrada.',
        );
      }
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        userId,
        content,
        scope: 'GLOBAL',
        country: 'BR',
        replyToId: dto.replyToId || null,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatarUrl: true,
            tradeCode: true,
            lastSeenAt: true,
          },
        },

        replyTo: {
          select: {
            id: true,
            userId: true,
            content: true,

            user: {
              select: {
                id: true,
                nickname: true,
                name: true,
                avatarUrl: true,
                lastSeenAt: true,
              },
            },
          },
        },

        likes: true,
      },
    });

    if (
      dto.replyToId &&
      message.replyTo &&
      message.replyTo.userId !== userId
    ) {
      await this.notificationService.create(
        message.replyTo.userId,
        'CHAT_REPLY',
        'Responderam sua mensagem',
        `${message.user.nickname || message.user.name} respondeu sua mensagem no Chat Global.`,
        '/chat-global',
      );
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            nickname: {
              not: null,
            },
          },
          {
            tradeCode: {
              not: null,
            },
          },
        ],
      },

      select: {
        id: true,
        nickname: true,
        name: true,
        tradeCode: true,
      },
    });

    const mentionedUsers = users.filter((user) => {
      if (user.id === userId) {
        return false;
      }

      const mentions = [
        user.nickname ? `@${user.nickname}` : null,
        user.tradeCode || null,
      ].filter(Boolean) as string[];

      return mentions.some((mention) =>
        content.toLowerCase().includes(
          mention.toLowerCase(),
        ),
      );
    });

    for (const mentionedUser of mentionedUsers) {
      await this.notificationService.create(
        mentionedUser.id,
        'CHAT_MENTION',
        'Você foi mencionado',
        `${message.user.nickname || message.user.name} mencionou você no Chat Global.`,
        '/chat-global',
      );
    }

    return this.alertService.success(
      'Mensagem enviada.',
      {
        id: message.id,
        content: message.content,
        imageUrl: message.imageUrl,
        isPinned: message.isPinned,
        isEdited: message.isEdited,
        createdAt: message.createdAt,

        user: message.user,

        replyTo: message.replyTo
          ? {
              id: message.replyTo.id,
              content: message.replyTo.content,
              user: message.replyTo.user,
            }
          : null,

        likesCount: 0,
        likedByMe: false,
      },
    );
  }

  async toggleLike(
    userId: string,
    messageId: string,
  ) {
    const message = await this.prisma.chatMessage.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!message || message.isDeleted) {
      throw new NotFoundException(
        'Mensagem não encontrada.',
      );
    }

    const existingLike =
      await this.prisma.chatMessageLike.findUnique({
        where: {
          userId_messageId: {
            userId,
            messageId,
          },
        },
      });

    if (existingLike) {
      await this.prisma.chatMessageLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      return this.alertService.success(
        'Curtida removida.',
        {
          liked: false,
        },
      );
    }

    await this.prisma.chatMessageLike.create({
      data: {
        userId,
        messageId,
      },
    });

    return this.alertService.success(
      'Mensagem curtida.',
      {
        liked: true,
      },
    );
  }

  async deleteMessage(
    userId: string,
    messageId: string,
  ) {
    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        userId,
        isDeleted: false,
      },
    });

    if (!message) {
      throw new NotFoundException(
        'Mensagem não encontrada.',
      );
    }

    const updated = await this.prisma.chatMessage.update({
      where: {
        id: message.id,
      },

      data: {
        isDeleted: true,
        content: 'Mensagem apagada.',
      },
    });

    return this.alertService.success(
      'Mensagem apagada.',
      updated,
    );
  }

  async sendFriendRequest(
    senderId: string,
    receiverId: string,
  ) {
    if (senderId === receiverId) {
      throw new BadRequestException(
        'Você não pode adicionar você mesmo.',
      );
    }

    const receiver = await this.prisma.user.findUnique({
      where: {
        id: receiverId,
      },
    });

    if (!receiver) {
      throw new NotFoundException(
        'Usuário não encontrado.',
      );
    }

    const alreadyFriends =
      await this.prisma.friendship.findFirst({
        where: {
          OR: [
            {
              userAId: senderId,
              userBId: receiverId,
            },
            {
              userAId: receiverId,
              userBId: senderId,
            },
          ],
        },
      });

    if (alreadyFriends) {
      throw new BadRequestException(
        'Este usuário já é seu amigo.',
      );
    }

    const existingRequest =
      await this.prisma.friendRequest.findFirst({
        where: {
          OR: [
            {
              senderId,
              receiverId,
              status: 'PENDING',
            },
            {
              senderId: receiverId,
              receiverId: senderId,
              status: 'PENDING',
            },
          ],
        },
      });

    if (existingRequest) {
      throw new BadRequestException(
        'Já existe uma solicitação de amizade pendente.',
      );
    }

    const request =
      await this.prisma.friendRequest.create({
        data: {
          senderId,
          receiverId,
        },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              nickname: true,
              avatarUrl: true,
              tradeCode: true,
            },
          },
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
      receiverId,
      'FRIEND_REQUEST',
      'Nova solicitação de amizade',
      `${sender?.nickname || sender?.name || 'Um colecionador'} quer ser seu amigo.`,
      '/chat-global',
    );

    return this.alertService.success(
      'Solicitação de amizade enviada.',
      request,
    );
  }

  async findFriendRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
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
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return this.alertService.success(
      'Solicitações encontradas.',
      requests,
    );
  }

  async acceptFriendRequest(
    userId: string,
    requestId: string,
  ) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      throw new NotFoundException(
        'Solicitação de amizade não encontrada.',
      );
    }

    const alreadyFriends =
      await this.prisma.friendship.findFirst({
        where: {
          OR: [
            {
              userAId: request.senderId,
              userBId: request.receiverId,
            },
            {
              userAId: request.receiverId,
              userBId: request.senderId,
            },
          ],
        },
      });

    if (!alreadyFriends) {
      await this.prisma.friendship.create({
        data: {
          userAId: request.senderId,
          userBId: request.receiverId,
        },
      });
    }

    const updated = await this.prisma.friendRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    return this.alertService.success(
      'Solicitação aceita.',
      updated,
    );
  }

  async rejectFriendRequest(
    userId: string,
    requestId: string,
  ) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      throw new NotFoundException(
        'Solicitação de amizade não encontrada.',
      );
    }

    const updated = await this.prisma.friendRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: 'REJECTED',
      },
    });

    return this.alertService.success(
      'Solicitação recusada.',
      updated,
    );
  }

  async findMyFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },

      include: {
        userA: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatarUrl: true,
            tradeCode: true,
            lastSeenAt: true,
          },
        },

        userB: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatarUrl: true,
            tradeCode: true,
            lastSeenAt: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    const friends = friendships.map((friendship) => {
      return friendship.userAId === userId
        ? friendship.userB
        : friendship.userA;
    });

    return this.alertService.success(
      'Amigos encontrados.',
      friends,
    );
  }

  async findMyChatInteractions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        nickname: true,
        tradeCode: true,
        name: true,
        lastSeenAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Usuário não encontrado.',
      );
    }

    const possibleMentions = [
      user.nickname ? `@${user.nickname}` : null,
      user.tradeCode || null,
      user.name ? `@${user.name}` : null,
    ].filter(Boolean) as string[];

    const dismissed =
      await this.prisma.chatInteractionDismissed.findMany({
        where: {
          userId,
        },
        select: {
          messageId: true,
        },
      });

    const dismissedMessageIds = dismissed.map(
      (item) => item.messageId,
    );

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        isDeleted: false,

        id: {
          notIn: dismissedMessageIds,
        },

        OR: [
          {
            replyTo: {
              is: {
                userId,
              },
            },
          },

          ...possibleMentions.map((mention) => ({
            content: {
              contains: mention,
            },
          })),
        ],
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatarUrl: true,
            tradeCode: true,
            lastSeenAt: true,
          },
        },

        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                avatarUrl: true,
                lastSeenAt: true,
              },
            },
          },
        },

        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 30,
    });

    const formatted = messages.map((message) => ({
      id: message.id,
      content: message.content,
      imageUrl: message.imageUrl,
      isPinned: message.isPinned,
      isEdited: message.isEdited,
      createdAt: message.createdAt,

      user: message.user,

      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            user: message.replyTo.user,
          }
        : null,

      likesCount: message.likes?.length || 0,

      likedByMe:
        message.likes?.some((like) => like.userId === userId) || false,
    }));

    return this.alertService.success(
      'Interações encontradas.',
      formatted,
    );
  }

  async dismissInteraction(
    userId: string,
    messageId: string,
  ) {
    const message = await this.prisma.chatMessage.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!message) {
      throw new NotFoundException(
        'Mensagem não encontrada.',
      );
    }

    await this.prisma.chatInteractionDismissed.upsert({
      where: {
        userId_messageId: {
          userId,
          messageId,
        },
      },

      update: {},

      create: {
        userId,
        messageId,
      },
    });

    return this.alertService.success(
      'Interação removida da sua lista.',
      {
        messageId,
      },
    );
  }
}