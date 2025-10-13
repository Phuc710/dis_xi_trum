// ✅ StatusManager.js
const { ActivityType } = require('discord.js');

const PRESENCE_PREFIX = '🎧';
const CHANNEL_PREFIX = '💫';
const CHANNEL_EMOJI = '🎶';

class StatusManager {
    constructor(client) {
        this.client = client;
        this.isPlaying = false;
        this.activeVoiceStatus = null;
    }

    // ⚙️ Hiển thị tổng số server
    async setServerCountStatus(serverCount) {
        if (this.isPlaying) return;
        try {
            await this.client.user.setPresence({
                activities: [{
                    name: ` Music | /help`,
                    type: ActivityType.Listening
                }],
                status: 'online'
            });
            console.log(`[STATUS] ✅ Đặt trạng thái mặc định: 🎧 Music | /help (${serverCount} server)`);
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi đặt trạng thái server:', error.message);
        }
    }

    // 🎵 Khi bot đang phát nhạc
    async setMusicStatus(songName, options = {}) {
        const {
            voiceChannel = null,
            presencePrefix = PRESENCE_PREFIX,
            channelPrefix = CHANNEL_PREFIX,
            channelEmoji = { name: CHANNEL_EMOJI }
        } = options;

        try {
            this.isPlaying = true;
            const activityName = `🎶 ${songName}`.slice(0, 128);

            await this.client.user.setPresence({
                activities: [{
                    name: activityName,
                    type: ActivityType.Listening
                }],
                status: 'online'
            });

            await this.applyVoiceChannelStatus(voiceChannel, {
                text: `${channelPrefix} ${songName}`.trim(),
                emoji: channelEmoji
            });
            console.log(`[STATUS] 🎶 Cùng lắng nghe: ${songName}`);
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi đặt trạng thái nhạc:', error.message);
        }
    }

    // 🧹 Khi dừng nhạc
    async clearMusicStatus() {
        try {
            this.isPlaying = false;
            await this.restoreVoiceChannelStatus();
            const serverCount = this.client.guilds.cache.size;
            await this.setServerCountStatus(serverCount);
            console.log('[STATUS] 🧹 Đã xóa trạng thái nghe nhạc, trở về mặc định');
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi xóa trạng thái:', error.message);
        }
    }

    // 🎯 Trạng thái tùy chỉnh (ít dùng)
    async setCustomStatus(activity, type = 'Listening') {
        if (this.isPlaying) return;
        try {
            await this.client.user.setPresence({
                activities: [{
                    name: activity,
                    type: ActivityType[type] || ActivityType.Listening
                }],
                status: 'online'
            });
            console.log(`[STATUS] ✅ Đặt trạng thái tùy chỉnh: ${activity}`);
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi đặt trạng thái tùy chỉnh:', error.message);
        }
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    setIsPlaying(playing) {
        this.isPlaying = playing;
    }

    // 💬 Hiển thị tên bài trong topic của channel
    async applyVoiceChannelStatus(voiceChannel, statusPayload = {}) {
        if (!voiceChannel) return;

        const channel = typeof voiceChannel === 'string'
            ? this.client.channels.cache.get(voiceChannel)
            : voiceChannel;

        if (!channel) return;

        const safeText = (statusPayload.text || '').slice(0, 100);
        const emojiPayload = statusPayload.emoji?.name || CHANNEL_EMOJI;

        try {
            if (this.activeVoiceStatus && this.activeVoiceStatus.channelId !== channel.id) {
                await this.restoreVoiceChannelStatus();
            }

            if (typeof channel.setTopic === 'function') {
                if (!this.activeVoiceStatus || this.activeVoiceStatus.channelId !== channel.id) {
                    this.activeVoiceStatus = {
                        channelId: channel.id,
                        previous: channel.topic ?? null
                    };
                }

                await channel.setTopic(`${emojiPayload} ${safeText}`.trim());
                console.log(`[STATUS] 💬 Đã cập nhật topic channel: ${channel.name}`);
            } else {
                console.warn(`[STATUS] ⚠️ Channel ${channel.name} không hỗ trợ setTopic`);
            }
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi cập nhật topic channel:', error.message);
        }
    }

    // 🔁 Khôi phục topic cũ
    async restoreVoiceChannelStatus() {
        if (!this.activeVoiceStatus) return;

        const { channelId, previous } = this.activeVoiceStatus;
        const channel = this.client.channels.cache.get(channelId);
        this.activeVoiceStatus = null;

        if (!channel) return;

        try {
            if (typeof channel.setTopic === 'function') {
                await channel.setTopic(previous ?? null);
                console.log(`[STATUS] 🔁 Khôi phục topic channel: ${channel.name}`);
            }
        } catch (error) {
            console.error('[STATUS] ❌ Lỗi khi khôi phục topic channel:', error.message);
        }
    }
}

module.exports = StatusManager;
