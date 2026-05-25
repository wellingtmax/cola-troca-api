import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';

import { PackService } from './pack.service';
import { OpenPackDto } from './dto/open-pack.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('packs')
export class PackController {
  constructor(
    private readonly packService: PackService,
  ) {}

  @Get()
  findAll() {
    return this.packService.findAll();
  }

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

  @UseGuards(JwtAuthGuard)
  @Post('free')
  openFreePack(
    @Req() req: any,
    @Body('albumId') albumId: string,
  ) {
    return this.packService.openFreePack(
      req.user.userId,
      albumId,
    );
  }
}