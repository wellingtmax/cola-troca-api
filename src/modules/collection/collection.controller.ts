import {
    Controller,
    Get,
    Param,
    Patch,
    Req,
    UseGuards
} from "@nestjs/common";

import { CollectionService } from "./collection.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";


@Controller('collection')
export class CollectionController {
    constructor(
        private readonly collectionsService: CollectionService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    findMyStickers(@Req() req: any) {
        return this.collectionsService.findMyStickers(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('pending-albums-count')
    countPedingAlbums(@Req() req: any) {
        return this.collectionsService.contPendingAlbums(req.user.userId)
    }

    @UseGuards(JwtAuthGuard)
    @Get('album/:albumId')
    findAlbumProgess(
        @Req() req: any,
        @Param('albumId') albumId: string,
    ) {
        return this.collectionsService.findAlbumProgress(
            req.user.userId,
            albumId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('duplicates')
    findDuplicates(@Req() req: any) {
        return this.collectionsService.findDuplicates(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('album/:albumId/sticker/:stickerId/place')
    placeSticker(
        @Req() req: any,
        @Param('albumId') albumId: string,
        @Param('stickerId') stickerId: string,
    ) {
        return this.collectionsService.placeSticker(
            req.user.userId,
            albumId,
            stickerId,
        );
    }
}