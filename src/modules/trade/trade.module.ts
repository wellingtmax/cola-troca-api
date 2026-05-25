import { Module } from '@nestjs/common';

import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';

import { PrismaModule } from '../../database/prisma.module';
import { CommonModule } from '../../common/common.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    NotificationModule,
  ],

  controllers: [TradeController],

  providers: [TradeService],
})
export class TradeModule {}