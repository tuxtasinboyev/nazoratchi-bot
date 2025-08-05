import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotService } from './bot.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const botService = app.get(BotService);
  await botService.startWebhookBots(app);

  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
}

bootstrap();
