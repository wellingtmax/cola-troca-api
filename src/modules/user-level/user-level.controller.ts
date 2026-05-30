import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserLevelService } from './user-level.service';
import { AlertService } from '../../common/services/alert.service';

@Controller('user-level')
export class UserLevelController {
  constructor(
    private readonly userLevelService: UserLevelService,
    private readonly alertService: AlertService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyLevel(@Req() req: any) {
    const data = await this.userLevelService.getMyLevel(
      req.user.userId,
    );

    return this.alertService.success(
      'Nível do usuário encontrado.',
      data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('table')
  getLevelTable() {
    const data = this.userLevelService.getLevelTable();

    return this.alertService.success(
      'Tabela de níveis encontrada.',
      data,
    );
  }
}