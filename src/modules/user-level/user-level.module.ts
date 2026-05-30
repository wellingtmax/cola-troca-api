import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { CommonModule } from '../../common/common.module';

import { UserLevelService } from './user-level.service';
import { UserLevelController } from './user-level.controller';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
  ],

  controllers: [
    UserLevelController,
  ],

  providers: [
    UserLevelService,
  ],

  exports: [
    UserLevelService,
  ],
})
export class UserLevelModule {}