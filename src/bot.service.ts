import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from './prisma/prisma.service';
import fetch from 'node-fetch';
import { GetMeResult } from './bot.interface';

@Injectable()
export class BotService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    private badWordCounter = new Map<number, number>();

    async onModuleInit() {
        const bots = await this.prisma.botModel.findMany({
            where: { name: 'Nazoratchi bot' },
        });

        for (const botModel of bots) {
            const tokenlar = await this.prisma.userBot.findMany({
                where: { botModelId: botModel.id },
            });

            for (const botTokenLog of tokenlar) {
                await this.startBot(botTokenLog.botToken, botTokenLog.userId);
            }
        }
    }

    async startBot(token: string, userId: number) {
        const bot = new Telegraf(token);

        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = (await res.json()) as GetMeResult;

        if (!data.ok) {
            throw new NotFoundException('Bot token xato yoki bloklangan!');
        }

        const badWords = await this.prisma.badWord.findMany();

        bot.on('message', async (ctx: Context) => {
            try {
                const msg = ctx.message as any;
                const from = msg?.from;
                const name = from?.username ? `@${from.username}` : `${from?.first_name} ${from?.last_name || ''}`.trim();
                const messageText: string = msg?.text || '';
                const lowerMessage = messageText.toLowerCase();
                const hasMedia = msg.video || msg.audio || msg.photo || msg.document || msg.sticker || msg.voice;

                const isSpam =
                    /(http|https|\.com|\.uz|@|t\.me|telegram\.me|reklama|obuna|like)/i.test(lowerMessage) || hasMedia;

                const isAdmin = (await ctx.getChatAdministrators()).some(
                    (admin) => admin.user.id === from?.id,
                );

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

                    const current = this.badWordCounter.get(from.id) || 0;
                    this.badWordCounter.set(from.id, current + 1);

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
                    return;
                }
            } catch (err) {
                console.error('❌ Message error:', err.message);
            }
        });

        await bot.launch();
        console.log(`🤖 ${data.result.username} BOT ishga tushdi!`);

        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
    }
}






