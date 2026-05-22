import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';

import { JwtAuthGuard }
  from '../auth/guards/jwt-auth.guard';

import { TradeService } from './trade.service';

import { CreateTradeDto }
  from './dto/create-trade.dto';

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
}