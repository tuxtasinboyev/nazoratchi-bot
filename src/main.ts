import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          'amqps://fhrzlrdw:hDfPFXgmeA3RbotR3urp0T3Dp2x8u7NY@kebnekaise.lmq.cloudamqp.com/fhrzlrdw',
        ],
        queue: 'observer_bot_queue',
        queueOptions: { durable: false },
      },
    },
  );

  await app.listen();
  console.log('🟢 Observer Bot Microservice is listening via RabbitMQ');
}

bootstrap();
