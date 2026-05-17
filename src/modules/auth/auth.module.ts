import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthControler } from "./auth.controller";
import { AuthService } from "./auth.service";

import { PrismaModule } from '../../database/prisma.module';
import { CommonModule } from '../../common/common.module';

import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        PrismaModule,
        CommonModule,

        PassportModule,

        JwtModule.register({
            secret: 'cola_troca_secret_dev',
            signOptions: { expiresIn: '15m'},
        }),
    ],
    controllers: [AuthControler],
    providers: [
        AuthService,
        JwtStrategy,
    ],
})
export class AuthModule {}