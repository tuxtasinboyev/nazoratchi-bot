import { Controller, Module } from '@nestjs/common';
import { ControllerBot } from './nazoratji.controller.bot';
import { BotService } from './bot.service';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ControllerBot,AppController],
  providers: [BotService],
})
export class AppModule { }
