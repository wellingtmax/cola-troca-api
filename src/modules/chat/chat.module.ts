import { Module } from '@nestjs/common';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { NotificationModule } from '../notification/notification.module';

import { PrismaModule } from '../../database/prisma.module';
import { CommonModule } from '../../common/common.module';

@Module({
    imports: [
        PrismaModule,
        CommonModule,
        NotificationModule,
    ],
    controllers: [ChatController],
    providers: [ChatService],
})

export class ChatModule {}