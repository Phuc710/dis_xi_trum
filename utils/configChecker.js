/**
 * Config Checker - Kiểm tra tính hợp lệ của cấu hình
 * Made with ❤️ by Phucx for Vietnamese Community
 */

const fs = require('fs');
const path = require('path');
const colors = require('../UI/colors/colors');

class ConfigChecker {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.success = [];
    }

    /**
     * Kiểm tra file config.js
     */
    checkConfigFile() {
        try {
            const configPath = path.join(__dirname, '..', 'config.js');
            
            if (!fs.existsSync(configPath)) {
                this.errors.push('File config.js không tồn tại');
                return false;
            }

            const config = require(configPath);
            
            // Kiểm tra các trường bắt buộc
            const requiredFields = ['token', 'prefix', 'mongodbUri'];
            for (const field of requiredFields) {
                if (!config[field]) {
                    this.errors.push(`Thiếu trường bắt buộc: ${field}`);
                }
            }

            // Kiểm tra categories
            if (!config.categories || Object.keys(config.categories).length === 0) {
                this.warnings.push('Không có categories được cấu hình');
            }

            // Kiểm tra status configuration
            if (!config.status) {
                this.warnings.push('Thiếu cấu hình status - bot sẽ dùng cấu hình mặc định');
            } else {
                if (!config.status.rotateDefault || config.status.rotateDefault.length === 0) {
                    this.warnings.push('Không có status mặc định');
                } else {
                    this.success.push(`Đã cấu hình ${config.status.rotateDefault.length} status mặc định`);
                }
            }

            this.success.push('File config.js hợp lệ');
            return true;

        } catch (error) {
            this.errors.push(`Lỗi đọc config.js: ${error.message}`);
            return false;
        }
    }

    /**
     * Kiểm tra file .env
     */
    checkEnvFile() {
        try {
            const envPath = path.join(__dirname, '..', '.env');
            
            if (!fs.existsSync(envPath)) {
                this.warnings.push('File .env không tồn tại - bot sẽ dùng cấu hình từ config.js');
                return true;
            }

            const envContent = fs.readFileSync(envPath, 'utf8');
            const envVars = envContent.split('\n')
                .filter(line => line.includes('='))
                .map(line => line.split('=')[0]);

            const importantEnvVars = ['TOKEN', 'MONGODB_URI'];
            for (const envVar of importantEnvVars) {
                if (envVars.includes(envVar)) {
                    this.success.push(`Biến môi trường ${envVar} đã được cấu hình`);
                }
            }

            return true;

        } catch (error) {
            this.warnings.push(`Lỗi đọc .env: ${error.message}`);
            return true; // Không critical
        }
    }

    /**
     * Kiểm tra package.json
     */
    checkPackageFile() {
        try {
            const packagePath = path.join(__dirname, '..', 'package.json');
            
            if (!fs.existsSync(packagePath)) {
                this.errors.push('File package.json không tồn tại');
                return false;
            }

            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            if (!pkg.dependencies) {
                this.errors.push('Không có dependencies trong package.json');
                return false;
            }

            const requiredDeps = ['discord.js', 'mongoose', 'dotenv'];
            for (const dep of requiredDeps) {
                if (pkg.dependencies[dep]) {
                    this.success.push(`Dependency ${dep} đã được cài đặt`);
                } else {
                    this.errors.push(`Thiếu dependency: ${dep}`);
                }
            }

            return true;

        } catch (error) {
            this.errors.push(`Lỗi đọc package.json: ${error.message}`);
            return false;
        }
    }

    /**
     * Kiểm tra cấu trúc thư mục
     */
    checkDirectoryStructure() {
        const requiredDirs = [
            'commands',
            'events', 
            'handlers',
            'models',
            'UI',
            'utils'
        ];

        for (const dir of requiredDirs) {
            const dirPath = path.join(__dirname, '..', dir);
            if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                this.success.push(`Thư mục ${dir} tồn tại`);
            } else {
                this.warnings.push(`Thư mục ${dir} không tồn tại`);
            }
        }

        return true;
    }

    /**
     * Chạy tất cả kiểm tra
     */
    runAllChecks() {
        console.log('\n' + '═'.repeat(60));
        console.log(`${colors.cyan}${colors.bright}           🔍 KIỂM TRA CẤU HÌNH BOT 🔍${colors.reset}`);
        console.log('═'.repeat(60));

        this.checkPackageFile();
        this.checkConfigFile();
        this.checkEnvFile();
        this.checkDirectoryStructure();

        this.printResults();

        return this.errors.length === 0;
    }

    /**
     * In kết quả kiểm tra
     */
    printResults() {
        console.log('\n' + '─'.repeat(50));
        
        // In lỗi
        if (this.errors.length > 0) {
            console.log(`${colors.red}[ LỖI NGHIÊM TRỌNG ]${colors.reset}`);
            console.log('─'.repeat(30));
            this.errors.forEach(error => {
                console.log(`${colors.red}❌ ${error}${colors.reset}`);
            });
            console.log('');
        }

        // In cảnh báo
        if (this.warnings.length > 0) {
            console.log(`${colors.yellow}[ CẢNH BÁO ]${colors.reset}`);
            console.log('─'.repeat(30));
            this.warnings.forEach(warning => {
                console.log(`${colors.yellow}⚠️  ${warning}${colors.reset}`);
            });
            console.log('');
        }

        // In thành công
        if (this.success.length > 0) {
            console.log(`${colors.green}[ THÀNH CÔNG ]${colors.reset}`);
            console.log('─'.repeat(30));
            this.success.forEach(success => {
                console.log(`${colors.green}✅ ${success}${colors.reset}`);
            });
            console.log('');
        }

        // Tổng kết
        console.log('─'.repeat(50));
        const totalIssues = this.errors.length + this.warnings.length;
        
        if (this.errors.length === 0) {
            console.log(`${colors.green}🎉 CẤU HÌNH HỢP LỆ - BOT CÓ THỂ KHỞI ĐỘNG!${colors.reset}`);
            if (this.warnings.length > 0) {
                console.log(`${colors.yellow}📝 Có ${this.warnings.length} cảnh báo nhưng không ảnh hưởng đến hoạt động${colors.reset}`);
            }
        } else {
            console.log(`${colors.red}🚫 CẤU HÌNH CÓ VẤN ĐỀ - CẦN SỬA ${this.errors.length} LỖI${colors.reset}`);
        }
        
        console.log('═'.repeat(60) + '\n');
    }
}

module.exports = ConfigChecker;

// Chạy kiểm tra nếu file được gọi trực tiếp
if (require.main === module) {
    const checker = new ConfigChecker();
    const isValid = checker.runAllChecks();
    process.exit(isValid ? 0 : 1);
}