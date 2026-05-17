import { Module } from "@nestjs/common";

import { StickerController } from "./sticker.controller";
import { StickerService } from "./sticker.service";

import { PrismaModule } from "../../database/prisma.module";
import { CommonModule } from "../../common/common.module";

@Module({
    imports: [
        PrismaModule,
        CommonModule,
    ],

    controllers: [StickerController],
    providers: [StickerService],
})

export class StickerModule {}