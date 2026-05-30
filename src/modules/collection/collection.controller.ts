import {
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards
} from "@nestjs/common";

import { CollectionService } from "./collection.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";


@Controller('collection')
export class CollectionController {
    constructor(
        private readonly collectionService: CollectionService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    findMyStickers(@Req() req: any) {
        return this.collectionService.findMyStickers(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('pending-albums-count')
    countPedingAlbums(@Req() req: any) {
        return this.collectionService.contPendingAlbums(req.user.userId)
    }

    @UseGuards(JwtAuthGuard)
    @Get('album/:albumId')
    findAlbumProgess(
        @Req() req: any,
        @Param('albumId') albumId: string,
    ) {
        return this.collectionService.findAlbumProgress(
            req.user.userId,
            albumId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('duplicates')
    findDuplicates(@Req() req: any) {
        return this.collectionService.findDuplicates(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('album/:albumId/sticker/:stickerId/place')
    placeSticker(
        @Req() req: any,
        @Param('albumId') albumId: string,
        @Param('stickerId') stickerId: string,
    ) {
        return this.collectionService.placeSticker(
            req.user.userId,
            albumId,
            stickerId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('album/:albumId/place-all')
    placeAllStickersFromAlbum(
        @Req() req: any,
        @Param('albumId') albumId: string,
    ) {
        return this.collectionService.placeAllStickersFromAlbum(
            req.user.userId,
            albumId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('albums/:albumId/buy')
    buyAlbum(
        @Req() req: any,
        @Param('albumId') albumId: string,
    ) {
        return this.collectionService.buyAlbum(
            req.user.userId,
            albumId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('stickers/place-all')
    placeAllMyStickers(@Req() req: any) {
        return this.collectionService.placeAllMyStickers(
            req.user.userId,
        );
    }
}