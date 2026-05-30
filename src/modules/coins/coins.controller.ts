import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoinsService } from './coins.service';
import { CreateCoinCheckoutDto } from './dto/create-coin-checkout.dto';

@Controller('coins')
export class CoinsController {
  constructor(
    private readonly coinsService: CoinsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('packages')
  findPackages() {
    return this.coinsService.findPackages();
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @Req() req: any,
    @Body() dto: CreateCoinCheckoutDto,
  ) {
    return this.coinsService.createCheckout(
      req.user.userId,
      dto.packageId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-purchases')
  findMyPurchases(@Req() req: any) {
    return this.coinsService.findMyPurchases(
      req.user.userId,
    );
  }

  /*
    Rota preparada para gateway real.

    Futuramente, o gateway vai chamar algo assim:
    POST /api/coins/webhook/mercado-pago

    Nesse momento vamos:
    1. validar assinatura;
    2. consultar pagamento no gateway;
    3. localizar externalReference;
    4. aprovar compra;
    5. liberar coins.
  */
  @Post('webhook/:provider')
  async paymentWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
  ) {
    return {
      success: true,
      message:
        'Webhook recebido. Integração real será implementada depois.',
      provider,
      body,
    };
  }
}