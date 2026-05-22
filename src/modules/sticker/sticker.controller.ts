import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Patch,
    Req,
    UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StickerService } from "./sticker.service";
import { CreateStickerDto } from "./dto/create-sticker.dto";

@Controller('stickers')
export class StickerController {
    constructor(
        private readonly stickerService: StickerService,
    ) { }

    @Post()
    create(@Body() dto: CreateStickerDto) {
        return this.stickerService.create(dto);
    }

    @Get('album/:albumId')
    findByAlbum(@Param('albumId') albumId: string) {
        return this.stickerService.findByAlbum(albumId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my')
    findMyStickers(@Req() req: any) {
        return this.stickerService.findMyStickers(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('favorite/:id')
    toggleFavorite(
        @Req() req: any,
        @Param('id') id: any,
    ) {
        return this.stickerService.toggleFavorite(req.user.userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('place/:id')
    placeSticker(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.stickerService.placeSticker(
            req.user.userId,
            id,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('place-all')
    placeAllStickers(@Req() req: any) {
        return this.stickerService.placeAllStickers(
            req.user.userId
        );
    }
}

