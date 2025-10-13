// Update in mongodb.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const colors = require('./UI/colors/colors');
const config = require('./config.js');

const uri = config.mongodbUri || process.env.MONGODB_URI;

// FIX: Add SSL/TLS options for Node.js v22+
const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('\n' + '─'.repeat(45));
        console.log(`${colors.magenta}${colors.bright}🕸️  KẾT NỐI CƠ SỞ DỮ LIỆU${colors.reset}`);
        console.log('─'.repeat(45));
        console.log('\x1b[36m[ CƠ SỞ DỮ LIỆU ]\x1b[0m', '\x1b[32mKết nối thành công đến MongoDB ✅\x1b[0m');

        // FIX: Add same options for Mongoose
        await mongoose.connect(uri, {
            tls: true,
            tlsAllowInvalidCertificates: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('\x1b[36m[ MONGOOSE ]\x1b[0m', '\x1b[32mKết nối Mongoose thành công ✅\x1b[0m');
        
        await initCollections();

    } catch (err) {
        console.error(`${colors.red}[ LỖI KẾT NỐI ]${colors.reset} ${colors.red}❌ Không thể kết nối đến MongoDB hoặc Mongoose${colors.reset}`);
        console.error(`${colors.yellow}[ CHI TIẾT LỖI ]${colors.reset}`, err.message);
        console.log(`${colors.red}[ TẮT BOT ]${colors.reset} ${colors.red}Bot sẽ tắt do không thể kết nối database${colors.reset}`);
        process.exit(1);
    }
}


async function initCollections() {
    try {
        giveawayCollection = db.collection('giveaways');
        await giveawayCollection.createIndex({ messageId: 1 }, { unique: true });
        console.log('\x1b[36m[ BỘ SƯỤ TẬP ]\x1b[0m', '\x1b[32mKhởi tạo bộ sưu tập Giveaway thành công ✅\x1b[0m');
    } catch (err) {
        console.error(`${colors.red}[ LỖI ]${colors.reset} ${colors.red}❌ Lỗi khởi tạo bộ sưu tập Giveaway${colors.reset}`, err.message);
        console.log(`${colors.yellow}[ CẢNH BÁO ]${colors.reset} ${colors.yellow}Tiếp tục hoạt động mà không có tính năng Giveaway${colors.reset}`);
        giveawayCollection = null;
    }
}

const db = client.db("discord-bot");
const voiceChannelCollection = db.collection("voiceChannels");
const centralizedControlCollection = db.collection("centralizedControl"); 
const nqnCollection = db.collection("nqn");
const welcomeCollection = db.collection("welcomeChannels");
const autoroleCollection = db.collection("autorolesetups");
const serverConfigCollection = db.collection("serverconfig");
const reactionRolesCollection = db.collection("reactionRoles");
const antisetupCollection = db.collection("antisetup");
const anticonfigcollection = db.collection("anticonfiglist");
const afkCollection = db.collection('afk');
const notificationsCollection = db.collection("notifications");
const logsCollection = db.collection("logs");
const nicknameConfigs = db.collection("nicknameConfig");
const economyCollection = db.collection("economy"); 
const usersCollection = db.collection('users'); 
const epicDataCollection = db.collection('epicData');
const customCommandsCollection = db.collection('customCommands');
const birthdayCollection = db.collection('birthday'); 
const applicationCollection = db.collection('applications'); 
const serverLevelingLogsCollection = db.collection('serverLevelingLogs');
const commandLogsCollection = db.collection('commandLogs');
const reportsCollection = db.collection('reports'); 
const stickyMessageCollection = db.collection('stickymessages');
const serverStatsCollection = db.collection('serverStats');
const autoResponderCollection = db.collection('autoResponder');
const playlistCollection = db.collection('lavalinkplaylist');
const autoplayCollection = db.collection('autoplaylavalink');
const embedCollection = db.collection('aioembeds');
const countingCollection = db.collection('countingame');
const botStatusCollection = db.collection('bot_status');
const scheduleCollection = db.collection('scheduleCollections')
const gameAccountsCollection = db.collection('gameAccounts');
const centralMusicCollection = db.collection('centralMusic');

let giveawayCollection;

async function saveGiveaway(giveaway) {
    if (!giveawayCollection) {
        console.error("Giveaway collection not initialized!");
        return;
    }
    
    await giveawayCollection.updateOne(
        { messageId: giveaway.messageId },
        { $set: giveaway },
        { upsert: true }
    );
}

async function getGiveaways() {
    if (!giveawayCollection) {
        console.error("Giveaway collection not initialized!");
        return [];
    }
    
    return await giveawayCollection.find().toArray();
}

async function getGiveawayById(messageId) {
    if (!giveawayCollection) {
        console.error("Giveaway collection not initialized!");
        return null;
    }
    
    return await giveawayCollection.findOne({ messageId });
}

async function deleteGiveaway(messageId) {
    if (!giveawayCollection) {
        console.error("Giveaway collection not initialized!");
        return;
    }
    
    await giveawayCollection.deleteOne({ messageId });
}


module.exports = {
    connectToDatabase,
    voiceChannelCollection,
    centralizedControlCollection, 
    nqnCollection,
    welcomeCollection,
    giveawayCollections: db.collection('giveaways'), 
    saveGiveaway,
    getGiveaways,
    getGiveawayById,
    deleteGiveaway,
    autoroleCollection,
    serverConfigCollection,
    reactionRolesCollection,
    antisetupCollection,
    notificationsCollection,
    anticonfigcollection,
    afkCollection,
    logsCollection,
    nicknameConfigs,
    usersCollection,
    epicDataCollection,
    customCommandsCollection,
    economyCollection,
    birthdayCollection,
    applicationCollection,
    serverLevelingLogsCollection,
    commandLogsCollection,
    reportsCollection,
    stickyMessageCollection,
    serverStatsCollection,
    autoResponderCollection,
    playlistCollection,
    autoplayCollection,
    embedCollection,
    countingCollection,
    botStatusCollection,
    scheduleCollection,
    gameAccountsCollection,
    centralMusicCollection,
};
