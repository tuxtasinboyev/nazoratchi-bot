import { Injectable, NotFoundException } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from './prisma/prisma.service';
import fetch from 'node-fetch';
import { GetMeResult } from './bot.interface';
import { INestApplication } from '@nestjs/common';

@Injectable()
export class BotService {
    constructor(private prisma: PrismaService) { }

    private app: INestApplication;
    private runningBots = new Set<string>();
    private badWordCounters = new Map<string, Map<number, number>>();

    async startWebhookBots(app: INestApplication) {
        this.app = app;

        const bots = await this.prisma.botModel.findMany({
            where: { name: 'Nazoratchi bot' },
        });

        for (const botModel of bots) {
            const tokens = await this.prisma.userBot.findMany({
                where: { botModelId: botModel.id },
            });

            for (const token of tokens) {
                await this.startBot(token.botToken, token.userId);
            }
        }
    }

    async startBot(token: string, userId: number) {
        if (this.runningBots.has(token)) return;

        this.runningBots.add(token);
        this.badWordCounters.set(token, new Map());

        const bot = new Telegraf(token);

        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = (await res.json()) as GetMeResult;

        if (!data.ok) throw new NotFoundException('Bot token xato yoki bloklangan!');

        const badWords = await this.prisma.badWord.findMany();

        bot.on('message', async (ctx: Context) => {
            try {
                const msg = ctx.message as any;
                const from = msg?.from;
                const name = from?.username ? `@${from.username}` : `${from?.first_name} ${from?.last_name || ''}`.trim();
                const messageText: string = msg?.text || '';
                const lowerMessage = messageText.toLowerCase();
                const hasMedia = msg.video || msg.audio || msg.photo || msg.document || msg.sticker || msg.voice;

                const isSpam = /(http|https|\.com|\.uz|@|t\.me|telegram\.me|reklama|obuna|like)/i.test(lowerMessage) || hasMedia;
                const isAdmin = (await ctx.getChatAdministrators()).some((admin) => admin.user.id === from?.id);

                if (isSpam && !isAdmin) {
                    await ctx.deleteMessage();
                    const sent = await ctx.reply(`${name}, iltimos reklama yoki media yubormang! ❌`);
                    setTimeout(() => {
                        ctx.deleteMessage(sent.message_id).catch(() => { });
                    }, 5000);
                    return;
                }

                const hasBadWord = badWords.some((word) => {
                    const uzbekRegex = new RegExp(`\\b${word.uzbek.toLowerCase()}\\b`, 'i');
                    const russianRegex = new RegExp(`\\b${word.russian.toLowerCase()}\\b`, 'i');
                    const englishRegex = new RegExp(`\\b${word.english.toLowerCase()}\\b`, 'i');
                    return uzbekRegex.test(lowerMessage) || russianRegex.test(lowerMessage) || englishRegex.test(lowerMessage);
                });

                if (hasBadWord && !isAdmin) {
                    await ctx.deleteMessage();

                    const counter = this.badWordCounters.get(token)!;
                    const current = counter.get(from.id) || 0;
                    counter.set(from.id, current + 1);

                    if (current + 1 >= 3) {
                        try {
                            await ctx.banChatMember(from.id);
                            await ctx.reply(`🚫 ${name}, siz 3 marta so‘kinib, guruhdan chetlatildingiz!`);
                        } catch (e) {
                            await ctx.reply(`❌ ${name} bloklanishda xatolik yuz berdi.`);
                        }
                    } else {
                        const sent = await ctx.reply(`⛔️ ${name}, iltimos so'kinmang. (${current + 1}/3)`);
                        setTimeout(() => {
                            ctx.deleteMessage(sent.message_id).catch(() => { });
                        }, 5000);
                    }
                }
            } catch (err) {
                console.error('Message error:', err.message);
            }
        });

        const webhookPath = `/webhook/${userId}`;
        const externalUrl = process.env.RENDER_EXTERNAL_URL;
        await bot.telegram.setWebhook(`${externalUrl}${webhookPath}`);

        const expressApp = this.app.getHttpAdapter().getInstance();
        expressApp.use(bot.webhookCallback(webhookPath));
    }
}
