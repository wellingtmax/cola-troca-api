import { 
    Controller,
    Get,
    Param,
    Req,
    UseGuards
 } from "@nestjs/common";

 import { CollectionService } from "./collection.service";
 import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";


 @Controller('collection')
 export class CollectionController {
    constructor(
        private readonly collectionsService: CollectionService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findMyStickers(@Req() req: any) {
        return this.collectionsService.findMyStickers(req.user.userId);
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
 }