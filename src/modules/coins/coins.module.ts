import { Module } from '@nestjs/common';

import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';
import { PrismaModule } from '../../database/prisma.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
  ],
  controllers: [
    CoinsController,
  ],
  providers: [
    CoinsService,
  ],
  exports: [
    CoinsService,
  ],
})
export class CoinsModule {}