import { Module } from "@nestjs/common";

import { AlbumController } from "./album.controller";
import { AlbumService } from "./album.service";

import { PrismaModule } from "../../database/prisma.module";
import { CommonModule } from "../../common/common.module";
import { clearScreenDown } from "node:readline";

@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [AlbumController],
    providers: [AlbumService],
})

export class AlbumModule {}