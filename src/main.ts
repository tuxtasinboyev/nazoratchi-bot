  import { NestFactory } from '@nestjs/core';
  import { AppModule } from './app.module';
  import { MicroserviceOptions, Transport } from '@nestjs/microservices';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule); 

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [
          'amqps://fhrzlrdw:hDfPFXgmeA3RbotR3urp0T3Dp2x8u7NY@kebnekaise.lmq.cloudamqp.com/fhrzlrdw',
        ],
        queue: 'observer_bot_queue',
        queueOptions: {
          durable: false,
        },
      },
    });

    await app.startAllMicroservices();
    console.log('🟢 Observer Bot Microservice is listening via RabbitMQ');

    // await app.listen(process.env.PORT || 3000);
    // console.log(`🌐 Fake HTTP server ishlayapti portda: ${process.env.PORT || 3000}`);
  }

  bootstrap();
