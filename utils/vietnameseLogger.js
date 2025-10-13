/**
 * Vietnamese Logger System
 * Hệ thống log chuyên nghiệp cho Bot Việt Nam
 * Made with ❤️ by Phucx
 */

const colors = require('../UI/colors/colors');

class VietnameseLogger {
    constructor() {
        this.logLevels = {
            SUCCESS: { icon: '✅', color: colors.green, name: 'THÀNH CÔNG' },
            ERROR: { icon: '❌', color: colors.red, name: 'LỖI' },
            WARNING: { icon: '⚠️', color: colors.yellow, name: 'CẢNH BÁO' },
            INFO: { icon: 'ℹ️', color: colors.cyan, name: 'THÔNG TIN' },
            DEBUG: { icon: '🔧', color: colors.gray, name: 'DEBUG' },
            MUSIC: { icon: '🎵', color: colors.magenta, name: 'ÂM NHẠC' },
            COMMAND: { icon: '⚡', color: colors.blue, name: 'LỆNH' },
            DATABASE: { icon: '🗄️', color: colors.green, name: 'CƠ SỞ DỮ LIỆU' },
            SECURITY: { icon: '🛡️', color: colors.red, name: 'BẢO MẬT' },
            SYSTEM: { icon: '⚙️', color: colors.cyan, name: 'HỆ THỐNG' }
        };
    }

    /**
     * Tạo timestamp định dạng Việt Nam
     */
    getTimestamp() {
        return new Date().toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Log cơ bản
     */
    log(level, message, details = null) {
        const logLevel = this.logLevels[level.toUpperCase()];
        if (!logLevel) {
            console.log(`${colors.red}[ LỖI LOGGER ]${colors.reset} Level không hợp lệ: ${level}`);
            return;
        }

        const timestamp = this.getTimestamp();
        const prefix = `${colors.gray}[${timestamp}]${colors.reset} ${logLevel.color}[ ${logLevel.name} ]${colors.reset}`;
        
        console.log(`${prefix} ${logLevel.icon} ${message}`);
        
        if (details) {
            console.log(`${colors.gray}   └─ Chi tiết: ${details}${colors.reset}`);
        }
    }

    /**
     * Log thành công
     */
    success(message, details = null) {
        this.log('SUCCESS', message, details);
    }

    /**
     * Log lỗi
     */
    error(message, error = null) {
        this.log('ERROR', message);
        if (error) {
            console.log(`${colors.red}   └─ Stack trace: ${error.stack || error.message || error}${colors.reset}`);
        }
    }

    /**
     * Log cảnh báo
     */
    warning(message, details = null) {
        this.log('WARNING', message, details);
    }

    /**
     * Log thông tin
     */
    info(message, details = null) {
        this.log('INFO', message, details);
    }

    /**
     * Log debug
     */
    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            this.log('DEBUG', message);
            if (data) {
                console.log(`${colors.gray}   └─ Dữ liệu: ${JSON.stringify(data, null, 2)}${colors.reset}`);
            }
        }
    }

    /**
     * Log âm nhạc
     */
    music(message, details = null) {
        this.log('MUSIC', message, details);
    }

    /**
     * Log lệnh
     */
    command(message, user = null, guild = null) {
        let details = '';
        if (user && guild) {
            details = `Người dùng: ${user} | Server: ${guild}`;
        } else if (user) {
            details = `Người dùng: ${user}`;
        }
        this.log('COMMAND', message, details);
    }

    /**
     * Log database
     */
    database(message, collection = null) {
        let details = collection ? `Collection: ${collection}` : null;
        this.log('DATABASE', message, details);
    }

    /**
     * Log bảo mật
     */
    security(message, details = null) {
        this.log('SECURITY', message, details);
    }

    /**
     * Log hệ thống
     */
    system(message, details = null) {
        this.log('SYSTEM', message, details);
    }

    /**
     * Tạo banner đẹp
     */
    banner(title, subtitle = null) {
        const width = 70;
        const border = '═'.repeat(width);
        
        console.log('\n' + border);
        console.log(`${colors.yellow}${colors.bright}${title.padStart(width/2 + title.length/2).padEnd(width)}${colors.reset}`);
        
        if (subtitle) {
            console.log(`${colors.cyan}${subtitle.padStart(width/2 + subtitle.length/2).padEnd(width)}${colors.reset}`);
        }
        
        console.log(border + '\n');
    }

    /**
     * Log khởi động bot
     */
    botStartup(botName, version, author) {
        this.banner(`🤖 ${botName} - Phiên bản ${version}`, `Made with ❤️ by ${author}`);
        this.system(`Bot ${botName} đang khởi động...`);
    }

    /**
     * Log bot sẵn sàng
     */
    botReady(botTag, guildCount, userCount) {
        this.success(`Bot ${botTag} đã sẵn sàng!`);
        this.info(`Đang phục vụ ${guildCount} server với ${userCount} người dùng`);
    }

    /**
     * Log kết nối database
     */
    databaseConnected(dbName) {
        this.database(`Kết nối thành công đến database: ${dbName}`);
    }

    /**
     * Log lỗi database
     */
    databaseError(operation, error) {
        this.error(`Lỗi thao tác database: ${operation}`, error);
    }

    /**
     * Log thống kê định kỳ
     */
    stats(stats) {
        console.log(`\n${colors.cyan}[ THỐNG KÊ BOT ]${colors.reset}`);
        console.log('─'.repeat(40));
        
        for (const [key, value] of Object.entries(stats)) {
            console.log(`${colors.gray}${key.padEnd(20)}: ${colors.green}${value}${colors.reset}`);
        }
        
        console.log('─'.repeat(40) + '\n');
    }
}

// Export singleton instance
module.exports = new VietnameseLogger();