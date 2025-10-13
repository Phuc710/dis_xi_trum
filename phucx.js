const axios = require('axios');
const dotenv = require('dotenv');
const client = require('./main');
dotenv.config();
const AiChat = require('./models/aichat/aiModel');
const { Translate } = require('@google-cloud/translate').v2;
const { EmbedBuilder } = require('discord.js');


const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const BACKEND = 'https://server-backend-tdpa.onrender.com';

// Initialize Google Translate (fallback to free translation service if no API key)
const translate = process.env.GOOGLE_TRANSLATE_KEY ? new Translate({ key: process.env.GOOGLE_TRANSLATE_KEY }) : null;

const activeChannelsCache = new Map();
const MESSAGE_HISTORY_SIZE = Infinity; // Không giới hạn message

// Vietnam timezone offset (+7 GMT)
const VN_TIMEZONE_OFFSET = 7;

// Daily reset settings
const DAILY_RESET_HOUR = 0; // 12:00 AM (0:00) theo giờ VN
const WARNING_TIMES = [30, 10, 1]; // Thông báo trước 30p, 10p, 1p

// Improved translation functions with multiple fallbacks
async function translateText(text, targetLang = 'en') {
    try {
        if (translate) {
            // Use Google Translate API if available
            const [translation] = await translate.translate(text, targetLang);
            return translation;
        } else {
            // Try multiple free translation services
            return await translateWithFallbacks(text, targetLang);
        }
    } catch (error) {
        console.error('Translation error:', error);
        return text; // Return original text if translation fails
    }
}

// Multiple fallback translation services
async function translateWithFallbacks(text, targetLang) {
    const services = [
        // LibreTranslate (primary free service)
        async () => {
            const response = await axios.post('https://libretranslate.de/translate', {
                q: text,
                source: 'auto',
                target: targetLang,
                format: 'text'
            }, { timeout: 10000 });
            return response.data.translatedText;
        },
        // Backup LibreTranslate instance
        async () => {
            const response = await axios.post('https://translate.argosopentech.com/translate', {
                q: text,
                source: 'auto',
                target: targetLang,
                format: 'text'
            }, { timeout: 10000 });
            return response.data.translatedText;
        },
        // MyMemory API (free tier)
        async () => {
            const response = await axios.get(`https://api.mymemory.translated.net/get`, {
                params: {
                    q: text,
                    langpair: `auto|${targetLang}`
                },
                timeout: 10000
            });
            return response.data.responseData.translatedText;
        }
    ];

    for (let i = 0; i < services.length; i++) {
        try {
            const result = await services[i]();
            if (result && result.trim() !== text.trim()) {
                return result;
            }
        } catch (error) {
            console.warn(`Translation service ${i + 1} failed:`, error.message);
            continue;
        }
    }

    // If all services fail, return original text
    return text;
}

// Detect if text is Vietnamese
function isVietnamese(text) {
    const vietnameseChars = /[àáạảãâầấậhẩẫăằắjặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớiợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseChars.test(text);
}

// Check if message contains code blocks
function hasCodeBlocks(text) {
    return /```[\s\S]*?```/.test(text);
}

// Extract code blocks from text
function extractCodeBlocks(text) {
    const codeBlockRegex = /```(\w+)?([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
        codeBlocks.push({
            language: match[1] || 'text',
            code: match[2].trim()
        });
    }
    
    return codeBlocks;
}

// Store code blocks for copy functionality
const messageCodeBlocks = new Map();

// Split long text into chunks that fit Discord's 2000 character limit
function splitTextIntoChunks(text, maxLength = 1950) {
    // Use 1950 instead of 2000 to leave safety margin
    if (text.length <= maxLength) {
        return [text];
    }
    
    const chunks = [];
    let currentChunk = '';
    
    // Split by lines to avoid breaking in the middle of sentences
    const lines = text.split('\n');
    
    for (const line of lines) {
        // If single line is too long, force split it by words first
        if (line.length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            
            // Try to split by words if it's plain text
            const words = line.split(' ');
            if (words.length > 1) {
                let tempLine = '';
                for (const word of words) {
                    if ((tempLine + word + ' ').length > maxLength) {
                        if (tempLine) {
                            chunks.push(tempLine.trim());
                            tempLine = word + ' ';
                        } else {
                            // Single word is too long, force split it
                            for (let i = 0; i < word.length; i += maxLength) {
                                chunks.push(word.substring(i, i + maxLength));
                            }
                        }
                    } else {
                        tempLine += word + ' ';
                    }
                }
                if (tempLine.trim()) {
                    currentChunk = tempLine;
                }
            } else {
                // No words to split, force split by character
                for (let i = 0; i < line.length; i += maxLength) {
                    chunks.push(line.substring(i, i + maxLength));
                }
            }
            continue;
        }
        
        // Check if adding this line would exceed limit
        if ((currentChunk + line + '\n').length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text];
}

// Format AI response with beautiful code blocks using embeds
function formatResponseWithCodeBlocks(aiResponse) {
    const messages = [];
    
    // Check if response has code blocks
    if (!hasCodeBlocks(aiResponse)) {
        // No code blocks, split if too long
        const chunks = splitTextIntoChunks(aiResponse);
        return chunks.map(chunk => ({ content: chunk }));
    }
    
    // Split response into text and code blocks
    const parts = [];
    let lastIndex = 0;
    const codeBlockRegex = /```(\w+)?([\s\S]*?)```/g;
    let match;
    let codeBlockCounter = 0;
    
    while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
        // Add text before code block
        if (match.index > lastIndex) {
            const textBefore = aiResponse.substring(lastIndex, match.index).trim();
            if (textBefore) {
                parts.push({ type: 'text', content: textBefore });
            }
        }
        
        // Add code block with unique ID
        codeBlockCounter++;
        parts.push({
            type: 'code',
            language: match[1] || 'text',
            code: match[2].trim(),
            id: codeBlockCounter
        });
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < aiResponse.length) {
        const textAfter = aiResponse.substring(lastIndex).trim();
        if (textAfter) {
            parts.push({ type: 'text', content: textAfter });
        }
    }
    
    // Create messages with embeds for code blocks
    for (const part of parts) {
        if (part.type === 'text') {
            // Split long text into multiple messages
            const textChunks = splitTextIntoChunks(part.content);
            textChunks.forEach(chunk => {
                messages.push({ content: chunk });
            });
        } else if (part.type === 'code') {
            // Check if code block is too long for embed description (max 4096 chars)
            const codeBlockContent = `\`\`\`${part.language}\n${part.code}\n\`\`\``;
            
            if (codeBlockContent.length <= 4096 && part.code.split('\n').length <= 50) {
                // Fits in embed - use beautiful embed format
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2) // Discord blurple color
                    .setTitle(`💻 ${part.language.toUpperCase()} Code`)
                    .setDescription(codeBlockContent)
                    .setFooter({ text: 'Click vào code block và Ctrl+C để copy!' })
                    .setTimestamp();
                
                messages.push({ 
                    embeds: [embed],
                    codeData: { language: part.language, code: part.code, id: part.id }
                });
            } else {
                // Too long for embed, split code into multiple messages
                // Calculate max code length (2000 - length of code block markers)
                const codeBlockWrapper = `\`\`\`${part.language}\n\n\`\`\``;
                const maxCodeLength = 1950 - codeBlockWrapper.length; // Safety margin
                
                if (part.code.length <= maxCodeLength) {
                    // Can fit in one message
                    messages.push({ 
                        content: `💻 **${part.language.toUpperCase()} Code:**\n\`\`\`${part.language}\n${part.code}\n\`\`\`` 
                    });
                } else {
                    // Need to split into multiple messages
                    messages.push({ content: `💻 **${part.language.toUpperCase()} Code (Part 1/${Math.ceil(part.code.length / maxCodeLength)}):**` });
                    
                    const codeLines = part.code.split('\n');
                    let currentCode = '';
                    let partNumber = 1;
                    
                    for (const line of codeLines) {
                        // Check if adding this line would exceed limit
                        if ((currentCode + line + '\n').length > maxCodeLength) {
                            if (currentCode.trim()) {
                                messages.push({ 
                                    content: `\`\`\`${part.language}\n${currentCode.trim()}\n\`\`\`` 
                                });
                                partNumber++;
                                
                                // Add header for next part
                                messages.push({ 
                                    content: `💻 **${part.language.toUpperCase()} Code (Part ${partNumber}):**` 
                                });
                            }
                            currentCode = line + '\n';
                        } else {
                            currentCode += line + '\n';
                        }
                    }
                    
                    // Send remaining code
                    if (currentCode.trim()) {
                        messages.push({ 
                            content: `\`\`\`${part.language}\n${currentCode.trim()}\n\`\`\`` 
                        });
                    }
                }
                
                messages.push({ content: '📋 *Click reaction để copy code!*' });
            }
        }
    }
    
    return messages;
}

// Get current Vietnam time
function getVietnamTime() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const vnTime = new Date(utc + (VN_TIMEZONE_OFFSET * 3600000));
    return vnTime;
}

// Format date separator
function formatDateSeparator(date) {
    const vnDate = date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
    });
    
    const separator = '─'.repeat(20);
    return `\n${separator} 📅 **${vnDate}** ${separator}\n`;
}

// Check if need to show date separator
function shouldShowDateSeparator(channelId) {
    const history = getConversationContext(channelId);
    if (history.length === 0) return true;
    
    const lastMessage = history[history.length - 1];
    if (!lastMessage.timestamp) return true;
    
    const lastDate = new Date(lastMessage.timestamp);
    const currentDate = getVietnamTime();
    
    return lastDate.toDateString() !== currentDate.toDateString();
}

// Reset all conversation history
function resetAllConversationHistory() {
    conversationHistory.clear();
    console.log(`🔄 All AI conversation history has been reset at ${getVietnamTime().toLocaleString('vi-VN')}`);
}

// Send reset warning to all active AI channels
async function sendResetWarning(minutesLeft) {
    try {
        const warningMessage = minutesLeft === 1 ?
            `⚠️ **Thông báo:** AI chat memory sẽ được reset sau **${minutesLeft} phút** nữa (12:00 AM - Giờ Việt Nam)\n📅 Ngày mới bắt đầu, hội thoại cũ sẽ được lưu trữ!` :
            `⚠️ **Thông báo:** AI chat memory sẽ được reset sau **${minutesLeft} phút** nữa (12:00 AM - Giờ Việt Nam)\n🔄 Hội thoại sẽ bắt đầu lại từ đầu!`;
        
        for (const [channelId, history] of conversationHistory) {
            if (history.length > 0) {
                try {
                    const channel = await client.channels.fetch(channelId);
                    if (channel) {
                        await channel.send(warningMessage);
                    }
                } catch (error) {
                    console.warn(`Could not send reset warning to channel ${channelId}:`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('Error sending reset warnings:', error);
    }
}

// Send reset completion message to all active AI channels
async function sendResetCompletedMessage() {
    try {
        const currentDate = getVietnamTime();
        const dateString = formatDateSeparator(currentDate);
        
        const resetMessage = `${dateString}🎆 **Ngày mới bắt đầu GOODLUCK Everyone!** Chào mừng đến với cuộc trò chuyện mới cùng Boo! 🔄`;
        
        // Get all channels that had active conversations before reset
        const activeChannels = [];
        for (const guild of client.guilds.cache.values()) {
            try {
                const configs = await AiChat.find({ guildId: guild.id, isEnabled: true });
                for (const config of configs) {
                    const channel = guild.channels.cache.get(config.channelId);
                    if (channel) {
                        activeChannels.push(channel);
                    }
                }
            } catch (error) {
                // Skip guild if error
            }
        }
        
        for (const channel of activeChannels) {
            try {
                await channel.send(resetMessage);
            } catch (error) {
                console.warn(`Could not send reset message to channel ${channel.id}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Error sending reset completed messages:', error);
    }
}

const conversationHistory = new Map();

function getConversationContext(channelId) {
    if (!conversationHistory.has(channelId)) {
        conversationHistory.set(channelId, []);
    }
    return conversationHistory.get(channelId);
}

function addToConversationHistory(channelId, role, text) {
    const history = getConversationContext(channelId);
    const timestamp = getVietnamTime().toISOString();
    
    history.push({ 
        role, 
        text, 
        timestamp 
    });
    
    // Không giới hạn message nữa - chỉ reset vào 12h đêm
    // if (history.length > MESSAGE_HISTORY_SIZE) {
    //     history.shift();
    // }
}

async function isAIChatChannel(channelId, guildId) {
    const cacheKey = `${guildId}-${channelId}`;
    if (activeChannelsCache.has(cacheKey)) {
        return activeChannelsCache.get(cacheKey);
    }

    try {
        
        const config = await AiChat.findActiveChannel(guildId, channelId);
        
        const isActive = !!config;
        activeChannelsCache.set(cacheKey, isActive);
        
 
        setTimeout(() => activeChannelsCache.delete(cacheKey), 5 * 60 * 1000);
        
        return isActive;
    } catch (error) {
        console.error(`Error checking AI chat status for ${channelId} in ${guildId}:`, error);
        return false;
    }
}

async function getGeminiResponse(prompt, channelId) {
    try {
        const history = getConversationContext(channelId);
        const isVietnameset = isVietnamese(prompt);
        
        const contents = [];
        
        // System prompt phù hợp với ngôn ngữ người dùng
        if (isVietnameset) {
            contents.push({
                role: "user",
                parts: [{ text: "Bạn là Boo, một trợ lý bot Discord thân thiện và hữu ích. Hãy luôn trả lời bằng tiếng Việt một cách tự nhiên và thân thiện. Khi cung cấp code, hãy sử dụng markdown code blocks với ngôn ngữ phù hợp (```javascript, ```python, ```html, v.v...). Hãy giới thiệu bản thân là Boo khi thích hợp. Giữ câu trả lời ngắn gọn và hữu ích." }]
            });
            
            contents.push({
                role: "model",
                parts: [{ text: "Chào bạn! Tôi là Boo, trợ lý Discord của bạn. Tôi sẽ trả lời bằng tiếng Việt một cách tự nhiên và thân thiện. Khi cần thiết, tôi sẽ sử dụng code blocks để format code đẹp mắt. Tôi sẵn sàng giúp đỡ bạn!" }]
            });
        } else {
            contents.push({
                role: "user",
                parts: [{ text: "You are Boo, a helpful Discord bot assistant. Keep your responses concise and friendly. When providing code, use proper markdown code blocks with appropriate language syntax (```javascript, ```python, ```html, etc.). Always introduce yourself as Boo when appropriate. Respond in English." }]
            });
            
            contents.push({
                role: "model",
                parts: [{ text: "Hello! I'm Boo, your Discord assistant. I'll keep my responses concise and friendly, and use proper code blocks for any code examples. I'm ready to help you!" }]
            });
        }
        
        // Thêm lịch sử hội thoại
        for (const msg of history) {
            contents.push({
                role: msg.role === "bot" ? "model" : "user",
                parts: [{ text: msg.text }]
            });
        }
        
        // Thêm câu hỏi hiện tại (không dịch)
        contents.push({
            role: "user",
            parts: [{ text: prompt }]
        });
        
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1000,
                }
            }
        );
        
        if (response.data && 
            response.data.candidates && 
            response.data.candidates[0] && 
            response.data.candidates[0].content &&
            response.data.candidates[0].content.parts) {
            
            const aiResponse = response.data.candidates[0].content.parts[0].text;
            return aiResponse.trim();
        }
        
        return "Xin lỗi, tôi không thể tạo phản hồi lúc này.";
    } catch (error) {
        console.error('Error getting Gemini response:', error.response?.data || error.message);
        
        // Trả về thông báo lỗi phù hợp với ngôn ngữ
        const isVietnameset = isVietnamese(prompt);
        return isVietnameset ? 
            "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau." :
            "Sorry, I encountered an error processing your request. Please try again later.";
    }
}

client.once('clientReady', async () => {
    const payload = {
        name:     client.user.tag,
        avatar:   client.user.displayAvatarURL({ format: 'png', size: 128 }),
        timestamp: new Date().toISOString(),
    };

    try {
        await axios.post(`${BACKEND}/api/bot-info`, payload);
    } catch (err) {
        //console.error('❌ Failed to connect:', err.message);
    }
    
    console.log(`🤖 ${client.user.tag} is online with AI chat capabilities!`);
    
    // Setup daily reset scheduler
    setupDailyResetScheduler();
});

// Setup daily reset scheduler with Vietnam timezone
function setupDailyResetScheduler() {
    console.log('🕰️ Setting up daily AI memory reset scheduler (Vietnam timezone)');
    
    function scheduleNextReset() {
        const now = getVietnamTime();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(DAILY_RESET_HOUR, 0, 0, 0);
        
        const msUntilReset = tomorrow.getTime() - now.getTime();
        
        console.log(`📅 Next AI memory reset scheduled for: ${tomorrow.toLocaleString('vi-VN')}`);
        
        // Schedule warning notifications
        for (const minutes of WARNING_TIMES) {
            const warningTime = msUntilReset - (minutes * 60 * 1000);
            if (warningTime > 0) {
                setTimeout(() => {
                    sendResetWarning(minutes);
                }, warningTime);
            }
        }
        
        // Schedule the actual reset
        setTimeout(async () => {
            resetAllConversationHistory();
            await sendResetCompletedMessage();
            scheduleNextReset(); // Schedule next day
        }, msUntilReset);
    }
    
    scheduleNextReset();
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (!message.guild) return;
    
    const isActive = await isAIChatChannel(message.channel.id, message.guild.id);
    if (!isActive) return;
    
    const typingIndicator = message.channel.sendTyping();
    
    try {
        // Date separator chỉ được hiển thị sau khi reset (12h AM)
        // Không hiển thị trong chat thường ngày
        
        addToConversationHistory(message.channel.id, "user", message.content);
        
        const aiResponse = await getGeminiResponse(message.content, message.channel.id);
        
        addToConversationHistory(message.channel.id, "bot", aiResponse);
        
        // Format response with beautiful code blocks
        const formattedMessages = formatResponseWithCodeBlocks(aiResponse);
        
        let botMessage;
        let firstCodeMessage = null;
        
        // Send all formatted messages
        for (let i = 0; i < formattedMessages.length; i++) {
            const msg = formattedMessages[i];
            const sentMessage = await message.channel.send(msg);
            
            // Track first message with code for reaction
            if (!firstCodeMessage && msg.embeds && msg.embeds.length > 0) {
                firstCodeMessage = sentMessage;
            }
            
            // Keep reference to last message
            botMessage = sentMessage;
        }
        
        // Add copy reaction to code embed message
        if (firstCodeMessage && hasCodeBlocks(aiResponse)) {
            try {
                await firstCodeMessage.react('📋'); // 📋 clipboard emoji
                
                // Store code blocks for this message
                const codeBlocks = extractCodeBlocks(aiResponse);
                if (codeBlocks.length > 0) {
                    messageCodeBlocks.set(firstCodeMessage.id, codeBlocks);
                    
                    // Clean up after 10 minutes
                    setTimeout(() => {
                        messageCodeBlocks.delete(firstCodeMessage.id);
                    }, 10 * 60 * 1000);
                }
            } catch (error) {
                console.warn('Could not add copy reaction:', error.message);
            }
        }
    } catch (error) {
        console.error('Error in AI chat response:', error);
        await message.reply("Xin lỗi, tôi gặp lỗi khi xử lý tin nhắn của bạn.");
    }
});

// Handle reactions for copy code functionality
client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;
    
    // Only handle clipboard emoji on bot messages
    if (reaction.emoji.name === '📋' && reaction.message.author.id === client.user.id) {
        const messageId = reaction.message.id;
        const codeBlocks = messageCodeBlocks.get(messageId);
        
        if (codeBlocks && codeBlocks.length > 0) {
            try {
                // Create a formatted message with all code blocks
                let copyMessage = '📋 **Code được copy:**\n\n';
                
                codeBlocks.forEach((block, index) => {
                    copyMessage += `**${index + 1}. ${block.language.toUpperCase()}:**\n`;
                    copyMessage += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
                });
                
                // Add copy instructions
                const isViet = isVietnamese(reaction.message.content || '');
                const instructions = isViet ? 
                    '📝 **Cảm thấy như nào:** OKE CHỨ NÍ!' :
                    '📝 **Instructions:** Select the text above and copy (Ctrl+C) to use!';
                
                copyMessage += instructions;
                
                // Send as ephemeral-like message (DM or reply then delete)
                const replyMessage = await reaction.message.reply({
                    content: `${user}, ${copyMessage}`,
                    allowedMentions: { users: [user.id] }
                });
                
                // Delete the copy message after 30 seconds
                setTimeout(async () => {
                    try {
                        await replyMessage.delete();
                    } catch (error) {
                        // Message might already be deleted
                    }
                }, 30000);
                
                // Remove user's reaction
                try {
                    await reaction.users.remove(user.id);
                } catch (error) {
                    // Reaction might already be removed
                }
                
            } catch (error) {
                console.error('Error handling copy reaction:', error);
            }
        }
    }
});

let serverOnline = true;

module.exports = {
    isServerOnline: function() {
        return serverOnline;
    },
    validateCore: function() {
        return true; // Always return true for now
    },
    SECURITY_TOKEN: 'PHUCX_BOT_SECURITY_TOKEN_2024'
};

