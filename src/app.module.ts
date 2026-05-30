import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma.module';

import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AlbumModule } from './modules/album/album.module';
import { StickerModule } from './modules/sticker/sticker.module';
import { PackModule } from './modules/pack/pack.module';
import { CollectionModule } from './modules/collection/collection.module';
import { StoreModule } from './modules/store/store.module';
import { TradeModule } from './modules/trade/trade.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UserLevelModule } from './modules/user-level/user-level.module';
import { CoinsModule } from './modules/coins/coins.module';

import { CommonModule } from './common/common.module';


@Module({
  imports: [
    PrismaModule, 
    UserModule, 
    AuthModule, 
    CommonModule, 
    AlbumModule,
    StickerModule,
    PackModule,
    CollectionModule,
    StoreModule,
    TradeModule,
    ChatModule,
    NotificationModule,
    UserLevelModule,
    CoinsModule,
  ],
  
  controllers: [],
  providers: [],
})
export class AppModule {}