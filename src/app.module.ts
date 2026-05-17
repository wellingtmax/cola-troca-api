import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma.module';

import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AlbumModule } from './modules/album/album.module';
import { StickerModule } from './modules/sticker/sticker.module';
import { PackModule } from './modules/pack/pack.module';
import { CollectionModule } from './modules/collection/collection.module';
import { StoreModule } from './modules/store/store.module';

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
  ],
  
  controllers: [],
  providers: [],
})
export class AppModule {}