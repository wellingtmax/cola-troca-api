import { 
    Body,
    Controller,
    Post,
    Req,
    UseGuards,
 } from "@nestjs/common";


 import { Request } from "@nestjs/common";
 import { PackService } from "./pack.service";
 import { OpenPackDto } from "./dto/open-pack.dto";
 import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";


 @Controller('packs')
 export class PackController {

    constructor(
        private readonly packService: PackService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('open')
    openPack(
        @Req() req: any,
        @Body() dto: OpenPackDto,
    ) {

        return this.packService.openPack(
            req.user.userId,
            dto,
        );
    }
 }