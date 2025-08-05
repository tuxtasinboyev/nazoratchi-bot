import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from '@nestjs/microservices';
import { BotService } from "./bot.service";
@Controller('Nazoratchi-bot')
export class ControllerBot {
    constructor(private readonly botService: BotService) { }

    @EventPattern('start_observer_bot')
    async handleStartObserverBot(@Payload() data: { token: string, userId: number, categoryId: number }) {

        await this.botService.startBot(data.token, data.userId);
    }
}