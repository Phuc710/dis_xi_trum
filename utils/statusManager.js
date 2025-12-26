// ✅ StatusManager.js - Auto clear status khi bot rời voice
const { ActivityType } = require('discord.js');
const axios = require('axios');

const PRESENCE_PREFIX = '🎧';
const CHANNEL_PREFIX = '💫';
const CHANNEL_EMOJI = '🎶';

class StatusManager {
    constructor(client) {
        this.client = client;
        this.isPlaying = false;
        this.activeVoiceStatus = null;
        this.voiceChannelData = new Map();
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
                        console.log(`[STATUS] 🚪 Bot đã rời voice channel → clearVoiceChannelStatus()`);
                        await this.clearVoiceChannelStatus();
                    }
                }
            } catch (error) {
                console.error('[STATUS] ❌ Lỗi khi xử lý voice disconnect:', error.message);
            }
        });
    }

    // ⚙️ Trạng thái mặc định khi idle
    async setServerCountStatus(serverCount) {
        if (this.isPlaying) return;
        try {
            await this.client.user.setPresence({
                activities: [{ name: ` Music | /help`, type: ActivityType.Listening }],
                status: 'online'
            });
            console.log(`[STATUS] ✅ Đặt trạng thái mặc định: 🎧 Music | /help (${serverCount} server)`);
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi đặt trạng thái server:', error.message);
        }
    }

    // 🎵 Khi phát nhạc
    async setMusicStatus(songName, options = {}) {
        const { voiceChannel = null, channelPrefix = CHANNEL_PREFIX, channelEmoji = { name: CHANNEL_EMOJI } } = options;

        try {
            this.isPlaying = true;
            const activityName = `🎶 ${songName}`.slice(0, 128);
            await this.client.user.setPresence({
                activities: [{ name: activityName, type: ActivityType.Listening }],
                status: 'online'
            });

            await this.setVoiceChannelStatus(voiceChannel, songName, { prefix: channelPrefix, emoji: channelEmoji });
            console.log(`[STATUS] 🎶 Đang phát: ${songName}`);
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi đặt trạng thái nhạc:', error.message);
        }
    }

    // 🧹 Khi dừng nhạc
    async clearMusicStatus() {
        try {
            this.isPlaying = false;
            await this.clearVoiceChannelStatus();
            const serverCount = this.client.guilds.cache.size;
            await this.setServerCountStatus(serverCount);
            console.log('[STATUS] 🧹 Đã xóa trạng thái nghe nhạc, trở về mặc định');
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi xóa trạng thái:', error.message);
        }
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

        if (!this.voiceChannelData.has(channel.id)) {
            this.voiceChannelData.set(channel.id, {
                originalTopic: channel.topic ?? null,
                channelId: channel.id
            });
        }

        if (this.activeVoiceStatus && this.activeVoiceStatus.channelId !== channel.id) {
            await this.clearVoiceChannelStatus();
        }

        this.activeVoiceStatus = { channelId: channel.id, method: null };

        // Ưu tiên Voice Status API
        let success = await this.createVoiceStatusAPI(channel, statusText);
        if (success) {
            this.activeVoiceStatus.method = 'api';
            console.log(`[STATUS] 🎤 Voice Status API: ${channel.name}`);
            return;
        }

        // Fallback: topic
        success = await this.createChannelTopic(channel, statusText, emoji);
        if (success) {
            this.activeVoiceStatus.method = 'topic';
            console.log(`[STATUS] 💬 Topic updated: ${channel.name}`);
            return;
        }

        console.warn(`[STATUS] ⚠️ Không thể update voice channel status`);
    }

    // 🧩 Clear trạng thái
    async clearVoiceChannelStatus() {
        if (!this.activeVoiceStatus) return;
        const { channelId, method } = this.activeVoiceStatus;
        const channel = this.client.channels.cache.get(channelId);

        if (!channel) {
            this.activeVoiceStatus = null;
            this.voiceChannelData.delete(channelId);
            return;
        }

        try {
            if (method === 'api') {
                await this.deleteVoiceStatusAPI(channel);
                console.log(`[STATUS] 🔁 Voice Status API cleared: ${channel.name}`);
            } else if (method === 'topic') {
                await this.deleteChannelTopic(channel);
                console.log(`[STATUS] 🔁 Topic restored: ${channel.name}`);
            }
        } catch (error) {
            console.error(`[STATUS] ❌ Lỗi restore voice channel:`, error.message);
        } finally {
            this.activeVoiceStatus = null;
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
        await this.setMusicStatus(songName, options);
    }

    async onTrackEnd(player, options = {}) {
        if (options.final) await this.clearMusicStatus();
    }
}

module.exports = StatusManager;
