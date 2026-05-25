import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TradeService } from './trade.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { CounterTradeDto } from './dto/counter-trade.dto';

@Controller('trades')
export class TradeController {

  constructor(
    private readonly tradeService: TradeService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  createTrade(
    @Req() req: any,
    @Body() dto: CreateTradeDto,
  ) {
    return this.tradeService.createTrade(
      req.user.userId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyTrades(@Req() req: any) {
    return this.tradeService.findMyTrades(
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:tradeCode')
  findUserByTradeCode(
    @Param('tradeCode') tradeCode: string,
  ) {
    return this.tradeService.findUserByTradeCode(tradeCode);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/accept')
  acceptTrade(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.tradeService.acceptTrade(
      req.user.userId,
      id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  rejectTrade(
    @Req() req: any,
    @Param('id') id:  string,
  ) {
    return this.tradeService.rejectTrade(
      req.user.userId,
      id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelTrade(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.tradeService.cancelTrade(
      req.user.userId,
      id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/counter')
  counterTrade(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CounterTradeDto,
  ) {
    return this.tradeService.counterTrade(
      req.user.userId,
      id,
      dto,
    );
  }
}