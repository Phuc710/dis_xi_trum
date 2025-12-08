// ✅ StatusManager.js - Auto clear status khi bot rời voice
const { ActivityType } = require('discord.js');
const axios = require('axios');

// Custom Discord animated emojis
const PRESENCE_EMOJI = '<a:music:852564308864008222>'; // Emoji cho bot presence
const CHANNEL_PREFIX = '💫';
const CHANNEL_EMOJI = '<a:notes:856362922720231514>'; // Emoji cho voice channel

class StatusManager {
    constructor(client) {
        this.client = client;
        // Track playing status per guild instead of globally
        this.playingGuilds = new Map(); // guildId -> { songName, voiceChannelId }
        this.voiceChannelData = new Map(); // channelId -> { originalTopic, guildId }
        this.topicRateLimit = {};

        // 🧠 Tự động clear khi bot disconnect khỏi voice
        this.client.on('voiceStateUpdate', async (oldState, newState) => {
            try {
                // Nếu bot chính là user trong event
                if (oldState.member?.id === this.client.user.id) {
                    const wasInChannel = oldState.channelId;
                    const isInChannel = newState.channelId;

                    // Nếu bot vừa rời voice channel (hoặc bị kick)
                    if (wasInChannel && !isInChannel) {
                        const guildId = oldState.guild.id;
                        console.log(`[STATUS] 🚪 Bot đã rời voice channel trong guild ${guildId}`);
                        await this.clearGuildStatus(guildId);
                    }
                }
            } catch (error) {
                console.error('[STATUS] ❌ Lỗi khi xử lý voice disconnect:', error.message);
            }
        });
    }

    // ⚙️ Trạng thái mặc định khi idle
    async setServerCountStatus(serverCount) {
        // Only set default status if no guilds are playing music
        if (this.playingGuilds.size > 0) return;
        try {
            await this.client.user.setPresence({
                activities: [{ name: ` Music | /help`, type: ActivityType.Listening }],
                status: 'online'
            });
            console.log(`[STATUS] ✅🎧 Music | /help (${serverCount} server)`);
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi đặt trạng thái server:', error.message);
        }
    }

    // 🎵 Khi phát nhạc
    async setMusicStatus(songName, options = {}) {
        const { voiceChannel = null, channelPrefix = CHANNEL_PREFIX, channelEmoji = { name: CHANNEL_EMOJI }, guildId = null } = options;

        try {
            // Determine guild ID
            let targetGuildId = guildId;
            if (!targetGuildId && voiceChannel) {
                const channel = typeof voiceChannel === 'string' ? this.client.channels.cache.get(voiceChannel) : voiceChannel;
                targetGuildId = channel?.guild?.id;
            }

            if (targetGuildId) {
                // Get guild name
                const guild = this.client.guilds.cache.get(targetGuildId);
                const guildName = guild ? guild.name : `Server ${targetGuildId}`;
                
                // Track this guild as playing
                this.playingGuilds.set(targetGuildId, {
                    songName,
                    guildName,
                    voiceChannelId: typeof voiceChannel === 'string' ? voiceChannel : voiceChannel?.id
                });
            }

            // DON'T update global presence - keep it fixed
            // Only update voice channel status for THIS specific server's channel
            await this.setVoiceChannelStatus(voiceChannel, songName, { prefix: channelPrefix, emoji: channelEmoji });
            console.log(`[STATUS] 🎶 Server ${targetGuildId} - Voice channel status: ${songName}`);
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi đặt trạng thái nhạc:', error.message);
        }
    }

    // 🧹 Khi dừng nhạc (clear theo guild)
    async clearMusicStatus(guildId = null) {
        try {
            if (guildId) {
                await this.clearGuildStatus(guildId);
            } else {
                // Legacy: clear all if no guildId provided
                for (const [gId] of this.playingGuilds) {
                    await this.clearGuildStatus(gId);
                }
            }
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi xóa trạng thái:', error.message);
        }
    }

    // 🧹 Clear status for a specific guild
    async clearGuildStatus(guildId) {
        try {
            const guildData = this.playingGuilds.get(guildId);
            if (!guildData) return;

            // Clear voice channel status for this guild's channel
            if (guildData.voiceChannelId) {
                await this.clearVoiceChannelStatus(guildData.voiceChannelId);
            }

            // Remove guild from playing list
            this.playingGuilds.delete(guildId);

            // DON'T update global presence - keep it fixed
            console.log(`[STATUS] 🧹 Server ${guildId} - Voice channel status cleared`);
        } catch (error) {
            console.error(`[STATUS] ❌ Lỗi khi xóa trạng thái guild ${guildId}:`, error.message);
        }
    }

    // 📊 Update global bot presence - ALWAYS FIXED
    async updateGlobalPresence() {
        // This method does nothing - bot status is always fixed
        // Bot status is always "Listening to 🎧 Music | /help" and never changes
        // Only voice channel status changes per server independently
    }

    // === Voice Channel Status ===
    async setVoiceChannelStatus(voiceChannel, trackTitle, options = {}) {
        if (!voiceChannel) return;
        const channel = typeof voiceChannel === 'string' ? this.client.channels.cache.get(voiceChannel) : voiceChannel;
        if (!channel) return;

        const { prefix = CHANNEL_PREFIX, emoji = { name: CHANNEL_EMOJI } } = options;
        const statusText = `${prefix} ${trackTitle}`.trim().slice(0, 300);

        const botMember = channel.guild.members.cache.get(this.client.user.id);
        if (!botMember?.permissions.has('ManageChannels')) {
            console.warn(`[STATUS] ⚠️ Bot thiếu quyền MANAGE_CHANNELS trong ${channel.name}`);
            return;
        }

        // Store channel data with guild info
        if (!this.voiceChannelData.has(channel.id)) {
            this.voiceChannelData.set(channel.id, {
                originalTopic: channel.topic ?? null,
                channelId: channel.id,
                guildId: channel.guild.id,
                method: null
            });
        }

        const channelData = this.voiceChannelData.get(channel.id);
        
        // Ưu tiên Voice Status API
        let success = await this.createVoiceStatusAPI(channel, statusText);
        if (success) {
            channelData.method = 'api';
            console.log(`[STATUS] 🎤 Voice Status API: ${channel.name}`);
            return;
        }

        // Fallback: topic
        success = await this.createChannelTopic(channel, statusText, emoji);
        if (success) {
            channelData.method = 'topic';
            console.log(`[STATUS] 💬 Topic updated: ${channel.name}`);
            return;
        }

        console.warn(`[STATUS] ⚠️ Không thể update voice channel status`);
    }

    // 🧩 Clear trạng thái voice channel
    async clearVoiceChannelStatus(channelId) {
        if (!channelId) return;
        
        const channelData = this.voiceChannelData.get(channelId);
        if (!channelData) return;
        
        const channel = this.client.channels.cache.get(channelId);
        if (!channel) {
            this.voiceChannelData.delete(channelId);
            return;
        }

        try {
            if (channelData.method === 'api') {
                await this.deleteVoiceStatusAPI(channel);
                console.log(`[STATUS] 🔁 Voice Status API cleared: ${channel.name}`);
            } else if (channelData.method === 'topic') {
                await this.deleteChannelTopic(channel);
                console.log(`[STATUS] 🔁 Topic restored: ${channel.name}`);
            }
        } catch (error) {
            console.error(`[STATUS] ❌ Lỗi restore voice channel:`, error.message);
        } finally {
            this.voiceChannelData.delete(channelId);
        }
    }

    // === Voice Status API ===
    async createVoiceStatusAPI(channel, statusText) {
        try {
            const endpoint = `https://discord.com/api/v10/channels/${channel.id}/voice-status`;
            await axios.put(endpoint, { status: statusText }, {
                headers: { 'Authorization': `Bot ${this.client.token}`, 'Content-Type': 'application/json' },
                timeout: 5000
            });
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`[STATUS] ℹ️ Voice Status API không khả dụng cho server này`);
            } else if (error.response?.status === 50013) {
                console.warn(`[STATUS] ⚠️ Thiếu quyền Voice Status API`);
            } else {
                console.warn(`[STATUS] ⚠️ Voice Status API error:`, error.message);
            }
            return false;
        }
    }

    async deleteVoiceStatusAPI(channel) {
        try {
            const endpoint = `https://discord.com/api/v10/channels/${channel.id}/voice-status`;
            await axios.put(endpoint, { status: '' }, {
                headers: { 'Authorization': `Bot ${this.client.token}`, 'Content-Type': 'application/json' },
                timeout: 5000
            });
            return true;
        } catch {
            return false;
        }
    }

    // === Topic Fallback ===
    async createChannelTopic(channel, statusText, emoji) {
        try {
            if (typeof channel.setTopic !== 'function') return false;
            const now = Date.now();
            const last = this.topicRateLimit[channel.id] || 0;
            if (now - last < 300000) return false;

            const emojiStr = emoji?.name || CHANNEL_EMOJI;
            const newTopic = `${emojiStr} ${statusText}`.trim();
            if (channel.topic === newTopic) return true;

            await channel.setTopic(newTopic);
            this.topicRateLimit[channel.id] = now;
            return true;
        } catch {
            return false;
        }
    }

    async deleteChannelTopic(channel) {
        try {
            const originalData = this.voiceChannelData.get(channel.id);
            if (!originalData) return false;
            await channel.setTopic(originalData.originalTopic ?? null);
            return true;
        } catch {
            return false;
        }
    }

    // === Sự kiện từ Lavalink/DisTube ===
    async onTrackStart(player, track, options = {}) {
        const songName = track.info?.title || track.name || 'Unknown Track';
        const guildId = player.guildId || player.guild?.id;
        await this.setMusicStatus(songName, { ...options, guildId });
    }

    async onTrackEnd(player, options = {}) {
        if (options.final) {
            const guildId = player.guildId || player.guild?.id;
            await this.clearMusicStatus(guildId);
        }
    }
}

module.exports = StatusManager;
