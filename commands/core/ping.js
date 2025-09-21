const ms = require('ms');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'ping',
    description: "Kiểm tra ping bot",

    async execute({ client, inter }) {
        await inter.editReply("Ping...");
        
        const ping = Math.round(client.ws.ping);
        const heartbeat = ms(Date.now() - client.ws.shards.first().lastPingTimestamp, { long: true });
        
        inter.editReply(await Translate(`🏓 Pong! Độ trễ: **${ping}ms** | Nhịp tim: **${heartbeat}** trước`));
    }
};