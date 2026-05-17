import { Module } from "@nestjs/common";

import { PackController } from "./pack.controller";
import { PackService } from "./pack.service";

import { PrismaModule } from "../../database/prisma.module";
import { CommonModule } from "../../common/common.module";

@Module({
    imports: [
        PrismaModule,
        CommonModule,
    ],

    controllers: [PackController],
    providers: [PackService],
})
export class PackModule {}