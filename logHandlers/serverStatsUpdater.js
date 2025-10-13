const { serverStatsCollection } = require('../mongodb');
const { ChannelType } = require('discord.js');
const client = require('../main');
function formatDatePretty(locale = 'en-US') {
    const date = new Date();
    const day = date.getDate();
    const ordinal = (d) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };
    const months = date.toLocaleString(locale, { month: 'long' });
    const weekday = date.toLocaleString(locale, { weekday: 'short' });
    return `${day}${ordinal(day)} ${months} (${weekday})`;
}

function formatTimePretty(locale = 'en-US') {
    return new Date().toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

async function fetchStats(guild) {
    try {
  
        const members = await guild.members.fetch({ force: true });
        const roles = await guild.roles.fetch();
        const channels = await guild.channels.fetch();

        //console.log(`\n🔍 ${guild.name} - Làm mới thống kê hoàn tất`);

        const locale = guild.preferredLocale || 'en-US';

        const stats = {
            all: members.size,
            members: members.filter(m => !m.user.bot).size,
            bots: members.filter(m => m.user.bot).size,
            textchannels: channels.filter(ch => ch.type === ChannelType.GuildText).size,
            voicechannels: channels.filter(ch => ch.type === ChannelType.GuildVoice).size,
            categories: channels.filter(ch => ch.type === ChannelType.GuildCategory).size,
            roles: roles.size,
            date: formatDatePretty(locale),
        };

        //console.log(`📊 Thống kê cho ${guild.name}:`, stats);
        return stats;
    } catch (err) {
        //console.error(`❌ Không thể lấy thống kê cho máy chủ ${guild.id}`, err);
        return null;
    }
}

async function updateStatChannel(guild, stat, statsData, retryCount = 0) {
    try {
        const value = statsData[stat.type] ?? 0;
        const newName = stat.customName.replace('{count}', value);

        let channel = guild.channels.cache.get(stat.channelId);
        if (!channel) {
            try {
                channel = await guild.channels.fetch(stat.channelId); // Force fetch if missing in cache
            } catch (err) {
                //console.log(`🗑️ Kênh bị thiếu cho '${stat.type}', xóa mục thống kê: ${err.message}`);
                await serverStatsCollection.deleteOne({ _id: stat._id });
                return;
            }
        }

        if (!channel || typeof channel.setName !== 'function') {
            console.warn(`⚠️ Kênh không hợp lệ cho thống kê '${stat.type}'`);
            return;
        }

       
        if (retryCount === 0) {
            const botMember = guild.members.cache.get(client.user.id);
            if (botMember && channel.permissionsFor) {
                const hasPermission = channel.permissionsFor(botMember).has('ManageChannels');
                if (!hasPermission) {
                    //console.error(`❌ Bot thiếu quyền Quản lý Kênh cho kênh "${stat.type}"`);
                    return;
                }
            }
        }

        if (channel.name !== newName) {
            //console.log(`🔁 Đang thử cập nhật kênh: "${channel.name}" → "${newName}" cho thống kê "${stat.type}"`);
            
            try {
                await channel.setName(newName);
                //console.log(`✅ Cập nhật thành công tên kênh cho "${stat.type}": "${newName}"`);
              
                await serverStatsCollection.updateOne(
                    { _id: stat._id },
                    { $set: { lastUpdatedValue: value, lastUpdatedAt: new Date() } }
                );
                
                return true; 
            } catch (err) {
                if (err.code === 30013 || err.message.includes('rate limited')) {
                    //console.warn(`⏱️ Giới hạn tốc độ khi cập nhật kênh "${stat.type}". ${retryCount < 3 ? "Sẽ thử lại sau." : "Đã đạt tối đa lần thử."}`);
                    
              
                    if (retryCount < 3) {
                        const delay = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
                        console.log(`⏱️ Lên lịch thử lại #${retryCount + 1} cho "${stat.type}" trong ${delay/1000}s`);
                        
                        setTimeout(() => {
                            updateStatChannel(guild, stat, statsData, retryCount + 1);
                        }, delay);
                    }
                } else if (err.code === 50013) {
                    //console.error(`❌ Thiếu quyền để cập nhật tên kênh cho "${stat.type}"`);
                } else {
                    //console.error(`❌ Không thể cập nhật tên kênh cho "${stat.type}": ${err.message}`);
                    console.error(err);
                }
                return false; 
            }
        } else {
            return true;
        }
    } catch (err) {
        //console.warn(`⚠️ Lỗi cập nhật thống kê '${stat.type}' cho ${guild.name}:`, err);
        return false; // Failed
    }
}


async function updateAllStats(guild) {
    try {
        const statConfigs = await serverStatsCollection.find({ 
            guildId: guild.id,
            active: true,
            channelId: { $ne: null }
        }).toArray();
        
        if (!statConfigs || statConfigs.length === 0) {
            return;
        }

        const statsData = await fetchStats(guild);
        if (!statsData) return;

      
        let successCount = 0;
        let failCount = 0;
        
 
        for (const stat of statConfigs) {
            const success = await updateStatChannel(guild, stat, statsData);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
            
          
            if (statConfigs.length > 2) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        //console.log(`📊 Cập nhật thống kê cho ${guild.name}: ${successCount} thành công, ${failCount} thất bại/đã lên lịch thử lại`);
    } catch (err) {
        console.error(`❌ Không thể cập nhật thống kê cho máy chủ ${guild.id}:`, err);
    }
}

module.exports = (client) => {
    const startStatsUpdater = () => {
      
       
        setTimeout(async () => {
           
            for (const guild of client.guilds.cache.values()) {
                await updateAllStats(guild);
            }
        }, 5000); 

       
        setInterval(async () => {
            for (const guild of client.guilds.cache.values()) {
                await updateAllStats(guild);
            }
        }, 5 * 60 * 1000);
    };

   
    client.on('guildMemberAdd', async (member) => {
        await updateAllStats(member.guild);
    });

    client.on('guildMemberRemove', async (member) => {
        await updateAllStats(member.guild);
    });

    client.on('channelCreate', async (channel) => {
        if (channel.guild) await updateAllStats(channel.guild);
    });

    client.on('channelDelete', async (channel) => {
        if (channel.guild) await updateAllStats(channel.guild);
    });

    client.on('roleCreate', async (role) => {
        await updateAllStats(role.guild);
    });

    client.on('roleDelete', async (role) => {
        await updateAllStats(role.guild);
    });

    if (client.isReady()) {
        startStatsUpdater();
    } else {
        client.once('clientReady', startStatsUpdater);
    }
};
