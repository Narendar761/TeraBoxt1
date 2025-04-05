import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Telegraf, Markup, session } from 'telegraf';

const BOT_TOKEN = 'YOUR_TOKEN';
const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = 8080;
const MAX_VIDEO_SIZE = 50;

bot.use(session({ defaultSession: () => ({}) }));

app.use(express.json());
app.use(bot.webhookCallback('/webhook'));
app.get('/', (_, res) => res.send('🤖 Bot is running!'));
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

const teraboxUrlRegex = /^https?:\/\/(?:www\.)?(?:[\w-]+\.)?(terabox\.com|1024terabox\.com|teraboxapp\.com|terafileshare\.com|teraboxlink\.com|terasharelink\.com)\/(s|sharing)\/[\w-]+/i;

bot.start(ctx => {
    ctx.replyWithPhoto(
        { url: 'https://graph.org/file/4e8a1172e8ba4b7a0bdfa.jpg' },
        {
            caption: '👋 Welcome to TeraBox Downloader Bot!\n\nSend me a TeraBox sharing link to download files.',
            ...Markup.inlineKeyboard([
                [Markup.button.url('📌 Join Channel', 'https://t.me/Opleech_WD')]
            ])
        }
    );
});

bot.on('text', async ctx => {
    const text = ctx.message.text.trim();
    if (!teraboxUrlRegex.test(text)) return;

    if (ctx.session.lastLink === text) {
        return ctx.reply('⚠️ You already sent this link. Please wait...');
    }
    ctx.session.lastLink = text;

    try {
        const processingMessage = await ctx.reply('⏳ Processing link...');
        const apiUrl = `https://wdzone-terabox-api.vercel.app/api?url=${encodeURIComponent(text)}`;

        const { data } = await axios.get(apiUrl, { timeout: 120000 });

        const fileInfo = data?.['📜 Extracted Info']?.[0];
        if (!data?.['✅ Status'] || !fileInfo) {
            await ctx.deleteMessage(processingMessage.message_id);
            await ctx.reply('❌ No downloadable file found.');
            return;
        }

        const downloadLink = fileInfo['🔽 Direct Download Link'];
        let filename = (fileInfo['📂 Title'] || `file_${Date.now()}`).replace(/[^\w\s.-]/gi, '');
        if (!filename.endsWith('.mp4')) filename += '.mp4';
        const fileSizeText = fileInfo['📏 Size'] || 'N/A';
        const sizeMB = parseFloat(fileSizeText.replace('MB', '').trim()) || 0;

        await ctx.deleteMessage(processingMessage.message_id);

        if (sizeMB > MAX_VIDEO_SIZE) {
            await ctx.reply(
                `⚠️ File too large to send!\n\n📁 ${filename}\n📏 ${fileSizeText}`,
                Markup.inlineKeyboard([[Markup.button.url('🔗 Download Link', downloadLink)]])
            );
            return;
        }

        // Send the download link directly instead of downloading
        await ctx.reply(
            `✅ Here's your download link:\n\n📁 ${filename}\n📏 ${fileSizeText}`,
            Markup.inlineKeyboard([[Markup.button.url('🔗 Download Now', downloadLink)]])
        );

    } catch (err) {
        console.error('Error:', err.message);
        try {
            await ctx.deleteMessage(processingMessage?.message_id);
        } catch (e) {}
        await ctx.reply('❌ Failed to process the link. Please try again later.');
    }
});

// Set webhook
(async () => {
    try {
        await bot.telegram.setWebhook('https://solar-danielle-farhan43-e90c7451.koyeb.app/webhook');
        console.log('✅ Webhook set');
    } catch (err) {
        console.error('Webhook error:', err.message);
    }
})();
