import { Controller, Module } from '@nestjs/common';
import { ControllerBot } from './nazoratji.controller.bot';
import { BotService } from './bot.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ControllerBot],
  providers: [BotService],
})
export class AppModule { }
