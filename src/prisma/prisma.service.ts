import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private logger = new Logger(PrismaService.name)
    async onModuleInit() {
        try {
            await this.$connect()
            this.logger.log('database successfully conntected')
        } catch (error) {
            this.logger.log('datebase conecction error', error)
            await this.$disconnect()
        }
    }
}
