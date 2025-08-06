import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from './prisma/prisma.service';
import fetch from 'node-fetch';
import { GetMeResult } from './bot.interface';

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class BotService implements OnModuleInit {
    private readonly logger = new Logger(BotService.name);
    private badWordCounter = new Map<number, number>();
    private bots: Map<string, Telegraf<Context>> = new Map();

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        const botModel = await this.prisma.botModel.findUnique({
            where: { name: 'Nazoratchi bot' },
        });

        if (!botModel) {
            throw new NotFoundException('❌ Bot modeli topilmadi');
            return;
        }

        const userBots = await this.prisma.userBot.findMany({
            where: {
                botModelId: botModel.id,
                isActive: true,
                status: 'PENDING',
            },
        });

        await Promise.all(
            userBots.map(async (userBot) => {
                try {
                    await this.setupBot(userBot.botToken, userBot.userId, userBot.id);
                } catch (err) {
                    this.logger.warn(`❌ Token ishlamadi (${userBot.botToken}): ${err.message}`);
                    await this.prisma.botTokenLog.create({
                        data: {
                            botToken: userBot.botToken,
                            isValid: false,
                            userId: userBot.userId,
                            invalidReason: err.message,
                        },
                    });
                }
            }),
        );

        this.logger.log(`🔄 Jami ishga tushgan botlar: ${this.bots.size}`);

        process.once('SIGINT', async () => this.stopAllBots('SIGINT'));
        process.once('SIGTERM', async () => this.stopAllBots('SIGTERM'));
    }

    async startBot(token: string, userId: number) {
        if (this.bots.has(token)) {
            this.logger.warn(`⚠️ Bot allaqachon ishlayapti: ${token}`);
            return;
        }

        const existingLog = await this.prisma.botTokenLog.findFirst({
            where: { botToken: token },
        });

        if (!existingLog) {
            await this.prisma.botTokenLog.create({
                data: {
                    botToken: token,
                    isValid: true,
                    userId,
                },
            });
        }

        try {
            await this.setupBot(token, userId);
            this.logger.log('✅ Yangi bot token ishga tushdi');
        } catch (err) {
            throw new NotFoundException('Bot token xato yoki bloklangan!');
        }
    }

    private async setupBot(token: string, userId: number, userBotId?: number) {
        const bot = new Telegraf(token);
        this.bots.set(token, bot);

        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = (await res.json()) as GetMeResult;

        if (!data.ok) {
            throw new NotFoundException('Bot token xato yoki bloklangan!');
        }

        const badWords = await this.prisma.badWord.findMany();
        const badWordRegexes = badWords.flatMap((word) => [
            new RegExp(`\\b${word.uzbek.toLowerCase()}\\b`, 'i'),
            new RegExp(`\\b${word.russian.toLowerCase()}\\b`, 'i'),
            new RegExp(`\\b${word.english.toLowerCase()}\\b`, 'i'),
        ]);

        bot.on('message', async (ctx: Context) => {
            try {
                const msg = ctx.message as any;
                const from = msg?.from;
                const chatId = msg?.chat?.id;

                if (!from || !chatId) return;
                if (!['group', 'supergroup'].includes(ctx.chat!.type)) return;

                const name = from.username
                    ? `@${from.username}`
                    : `${from.first_name} ${from.last_name || ''}`.trim();

                const messageText: string = msg?.text || '';
                const lowerMessage = messageText.toLowerCase();
                const hasMedia =
                    msg.video || msg.audio || msg.photo || msg.document || msg.sticker || msg.voice;

                const isSpam =
                    /(http|https|\.com|\.uz|@|t\.me|telegram\.me|reklama|obuna|like)/i.test(lowerMessage) ||
                    hasMedia;

                const admins = await ctx.getChatAdministrators();
                const isOwner = admins.some(
                    (admin) => admin.user.id === from.id && admin.status === 'creator',
                );
                const isAdmin = admins.some((admin) => admin.user.id === from.id);

                if (isSpam && !isAdmin) {
                    try {
                        await ctx.deleteMessage();
                        const sent = await ctx.reply(`${name}, iltimos reklama yoki media yubormang! ❌`);
                        await sleep(5000);
                        await ctx.deleteMessage(sent.message_id).catch(() => { });
                    } catch (err) {
                        this.logger.warn(`❗ Spam deleteMessage error: ${err.message}`);
                    }
                    return;
                }

                const hasBadWord = badWordRegexes.some((regex) => regex.test(lowerMessage));
                if (hasBadWord) {
                    try {
                        await ctx.deleteMessage();
                    } catch (err) {
                        this.logger.warn(`❗ So‘kinish deleteMessage error: ${err.message}`);
                    }

                    const current = this.badWordCounter.get(from.id) || 0;
                    const updated = current + 1;
                    this.badWordCounter.set(from.id, updated);

                    if (isOwner) {
                        const sent = await ctx.reply(`⚠️ Hurmatli guruh egasi (${name}), iltimos so‘kinmang.`);
                        await sleep(5000);
                        await ctx.deleteMessage(sent.message_id).catch(() => { });
                        return;
                    }

                    if (isAdmin) {
                        const sent = await ctx.reply(`⚠️ ${name}, siz admin bo‘lsangizda, iltimos so‘kinmang.`);
                        await sleep(5000);
                        await ctx.deleteMessage(sent.message_id).catch(() => { });
                        return;
                    }

                    if (updated >= 3) {
                        try {
                            await ctx.banChatMember(from.id);
                            const sent = await ctx.reply(
                                `🚫 ${name}, siz 3 marta so‘kinib, guruhdan chetlatildingiz!`,
                            );
                            await sleep(5000);
                            await ctx.deleteMessage(sent.message_id).catch(() => { });
                        } catch (err) {
                            this.logger.error(`❌ Ban error: ${err.message}`);
                            const sent = await ctx.reply(
                                `❌ ${name} ni bloklashda xatolik: ${err.message}`,
                            );
                            await sleep(5000);
                            await ctx.deleteMessage(sent.message_id).catch(() => { });
                        }
                    } else {
                        const sent = await ctx.reply(
                            `⛔️ ${name}, iltimos so‘kinmang. (${updated}/3)`,
                        );
                        await sleep(5000);
                        await ctx.deleteMessage(sent.message_id).catch(() => { });
                    }
                }
            } catch (err) {
                this.logger.error(`❌ Message handler exception: ${err.message}`);
            }
        });

        await bot.launch();
        this.logger.log(`🤖 ${data.result.username} BOT ishga tushdi`);

        if (userBotId) {
            await this.prisma.userBot.update({
                where: { id: userBotId },
                data: { status: 'ACTIVE' },
            });
        }
    }

    private async stopAllBots(signal: string) {
        for (const bot of this.bots.values()) {
            await bot.stop(signal);
        }
        this.logger.warn(`🛑 Barcha botlar to‘xtatildi: ${signal}`);
    }
}
