import { Module } from '@nestjs/common';

import { StoreController } from './store.controller';
import { StoreService } from './store.service';

import { PrismaModule } from '../../database/prisma.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
  ],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}