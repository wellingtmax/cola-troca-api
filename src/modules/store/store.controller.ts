import {
    Controller,
    Param,
    Post,
    Req,
    UseGuards,
    Get,
} from '@nestjs/common';

import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('store')
export class StoreController {
    constructor(
        private readonly storeService: StoreService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('buy-album/:albumId')
    buyAlbum(
        @Req() req: any,
        @Param('albumId') albumId: string,
    ) {
        return this.storeService.buyAlbum(
            req.user.userId,
            albumId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-albums')
    myAlbums(@Req() req: any) {

        return this.storeService.myAlbums(
            req.user.userId,
        );
    }
}