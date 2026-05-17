import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit {
        constructor() {
            const adapter = new PrismaMariaDb({
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: 'M@x94125',
                database: 'cola_troca',
                allowPublicKeyRetrieval: true,

            });

            super({ adapter })
        }

    async onModuleInit() {
        await this.$connect();
    }
}

