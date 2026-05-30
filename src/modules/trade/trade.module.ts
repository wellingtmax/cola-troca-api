import { Module } from '@nestjs/common';

import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';

import { PrismaModule } from '../../database/prisma.module';
import { CommonModule } from '../../common/common.module';
import { NotificationModule } from '../notification/notification.module';
import { UserLevelModule } from '../user-level/user-level.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    NotificationModule,
    UserLevelModule,
  ],

  controllers: [TradeController],

  providers: [TradeService],
})
export class TradeModule {}