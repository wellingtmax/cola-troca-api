import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: any) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('address')
  updateAddress(@Req() req: any, @Body() dto: any) {
    return this.userService.updateAddress(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('avatar')
  updateAvatar(@Req() req: any, @Body() dto: any) {
    return this.userService.updateAvatar(req.user.userId, dto.avatarUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  dashboard(@Req() req: any) {
    return this.userService.dashboard(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('trade-code')
  generateTradeCode(@Req() req: any) {
    return this.userService.generateTradeCode(
      req.user.userId,
    )
  }

  @UseGuards(JwtAuthGuard)
  @Get('public/:id')
  getPublicProfile(
    @Param('id') id: string,
  ) {
    return this.userService.getPublicProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('featured-stickers')
  findMyFeaturedStickers(
    @Req() req: any,
  ) {
    return this.userService.findMyFeaturedStickers(
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('featured-stickers')
  updateFeaturedStickers(
    @Req() req: any,
    @Body('userStickerIds') userStickerIds: string[],
  ) {
    return this.userService.updateFeaturedStickers(
      req.user.userId,
      userStickerIds,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('presence')
  updateLastSeen(
    @Req() req: any,
  ) {
    return this.userService.updateLastSeen(
      req.user.userId
    );
  }
}