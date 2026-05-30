import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  CoinPurchaseStatus,
  PaymentProvider,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

@Injectable()
export class CoinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) {}

  private readonly coinPackages = [
    {
      id: 'coins_100',
      name: 'Pacote Inicial',
      coins: 100,
      priceCents: 10000,
      description: 'Ideal para começar sua coleção.',
      featured: false,
    },
    {
      id: 'coins_250',
      name: 'Pacote Colecionador',
      coins: 250,
      priceCents: 25000,
      description: 'Bom para comprar álbuns e packs pequenos.',
      featured: false,
    },
    {
      id: 'coins_500',
      name: 'Pacote Premium',
      coins: 500,
      priceCents: 50000,
      description: 'Perfeito para abrir vários packs.',
      featured: true,
    },
    {
      id: 'coins_1000',
      name: 'Pacote Mestre',
      coins: 1000,
      priceCents: 100000,
      description: 'Para quem quer evoluir mais rápido.',
      featured: false,
    },
    {
      id: 'coins_5000',
      name: 'Pacote Lendário',
      coins: 5000,
      priceCents: 500000,
      description: 'Alto saldo para grandes colecionadores.',
      featured: false,
    },
  ];

  findPackages() {
    const packages = this.coinPackages.map((item) => ({
      ...item,
      price: item.priceCents / 100,
    }));

    return this.alertService.success(
      'Pacotes de coins encontrados.',
      packages,
    );
  }

  async createCheckout(
    userId: string,
    packageId: string,
  ) {
    const selectedPackage = this.coinPackages.find(
      (item) => item.id === packageId,
    );

    if (!selectedPackage) {
      throw new BadRequestException(
        'Pacote de coins inválido.',
      );
    }

    const paymentProvider =
      (process.env.PAYMENT_PROVIDER as PaymentProvider) ||
      PaymentProvider.SIMULATED;

    const externalReference =
      `coins_${userId}_${Date.now()}`;

    if (paymentProvider === PaymentProvider.SIMULATED) {
      return this.createSimulatedApprovedPurchase(
        userId,
        selectedPackage,
        externalReference,
      );
    }

    const purchase = await this.prisma.coinPurchase.create({
      data: {
        userId,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        coins: selectedPackage.coins,
        priceCents: selectedPackage.priceCents,
        provider: paymentProvider,
        status: CoinPurchaseStatus.PENDING,
        externalReference,
        metadata: {
          message:
            'Compra criada aguardando integração com gateway de pagamento.',
        },
      },
    });

    return this.alertService.success(
      'Pedido de compra de coins criado.',
      {
        purchase,
        status: purchase.status,
        checkoutUrl: purchase.checkoutUrl,
        requiresExternalPayment: true,
      },
    );
  }

  private async createSimulatedApprovedPurchase(
    userId: string,
    selectedPackage: any,
    externalReference: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.coinPurchase.create({
        data: {
          userId,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          coins: selectedPackage.coins,
          priceCents: selectedPackage.priceCents,
          provider: PaymentProvider.SIMULATED,
          status: CoinPurchaseStatus.APPROVED,
          externalReference,
          providerPaymentId: `simulated_${Date.now()}`,
          paidAt: new Date(),
          metadata: {
            simulation: true,
          },
        },
      });

      const user = await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          coins: {
            increment: selectedPackage.coins,
          },
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          avatarUrl: true,
          coins: true,
          xp: true,
          level: true,
          levelTitle: true,
        },
      });

      return {
        purchase,
        user,
      };
    });

    return this.alertService.success(
      'Coins comprados com sucesso.',
      {
        package: {
          ...selectedPackage,
          price: selectedPackage.priceCents / 100,
        },
        purchase: result.purchase,
        coinsAdded: selectedPackage.coins,
        coinsRemaining: result.user.coins,
        user: result.user,
        requiresExternalPayment: false,
      },
    );
  }

  async confirmPaymentByExternalReference(
    externalReference: string,
    providerPaymentId: string,
    metadata?: any,
  ) {
    const purchase = await this.prisma.coinPurchase.findUnique({
      where: {
        externalReference,
      },
    });

    if (!purchase) {
      throw new BadRequestException(
        'Compra de coins não encontrada.',
      );
    }

    if (purchase.status === CoinPurchaseStatus.APPROVED) {
      return this.alertService.success(
        'Compra já havia sido aprovada.',
        {
          purchase,
          alreadyProcessed: true,
        },
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPurchase = await tx.coinPurchase.update({
        where: {
          id: purchase.id,
        },
        data: {
          status: CoinPurchaseStatus.APPROVED,
          providerPaymentId,
          paidAt: new Date(),
          metadata: metadata || {},
        },
      });

      const user = await tx.user.update({
        where: {
          id: purchase.userId,
        },
        data: {
          coins: {
            increment: purchase.coins,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          coins: true,
          xp: true,
          level: true,
          levelTitle: true,
        },
      });

      return {
        purchase: updatedPurchase,
        user,
      };
    });

    return this.alertService.success(
      'Pagamento confirmado e coins liberados.',
      {
        purchase: result.purchase,
        user: result.user,
      },
    );
  }

  async findMyPurchases(userId: string) {
    const purchases = await this.prisma.coinPurchase.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return this.alertService.success(
      'Histórico de compra de coins encontrado.',
      purchases,
    );
  }
}