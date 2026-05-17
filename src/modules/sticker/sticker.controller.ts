import { 
    Body,
    Controller,
    Get,
    Param,
    Post,
} from "@nestjs/common";

import { StickerService } from "./sticker.service";
import { CreateStickerDto } from "./dto/create-sticker.dto";

@Controller('stickers')
export class StickerController {
    constructor(
        private readonly stickerService: StickerService,
    ) {}

    @Post()
    create(@Body() dto: CreateStickerDto) {
        return this.stickerService.create(dto);
    }

    @Get()
    findByAlbum(@Param('albumId') albumId: string) {
        return this.stickerService.findByAlbum(albumId);
    }
}

