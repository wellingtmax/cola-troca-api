import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';

import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { UserLevelModule } from '../user-level/user-level.module';

import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    UserLevelModule,
  ],
  controllers: [CollectionController],
  providers: [CollectionService],
})
export class CollectionModule {}