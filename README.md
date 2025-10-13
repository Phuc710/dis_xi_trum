# 🤖 PHUCX Bot - Discord All-in-One Bot

<p align="center">
  <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTNyeGRzcjhodGJrajRiZWk5dnd4cHZhdDFtdDJsNjFnajVrNGZtZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vLZJfnIqxLla26Gr4i/giphy.gif" alt="Boo Bot" width="300">
</p>

<h1 align="center">🎵 PHUCX Bot - Music & Multi-Purpose Bot</h1>

<p align="center">
  <strong>Bot Discord đa năng</strong><br>
  Được phát triển bởi <strong>Phucx</strong>
</p>

<p align="center">
  <a href="https://discord.gg/cc9U4w6a">
    <img src="https://img.shields.io/badge/Discord-Join-blue?style=flat-square&logo=discord" alt="Join Discord" />
  </a>
  <a href="https://github.com/Phuc710/dis_xi_trum">
    <img src="https://img.shields.io/badge/GitHub-Repository-black?style=flat-square&logo=github" alt="GitHub" />
  </a>
  <a href="https://phucdev.xo.je">
    <img src="https://img.shields.io/badge/Website-Visit-green?style=flat-square&logo=web" alt="Website" />
  </a>
</p>

## ✨ Tính Năng Chính

### 🎵 **Hệ Thống Âm Nhạc**
- Phát nhạc từ YouTube, Spotify
- Hỗ trợ playlist và queue
- Điều khiển âm lượng, tua, lặp
- Giao diện music card đẹp mắt

### 🛡️ **Quản Lý & Bảo Mật**
- Hệ thống log chi tiết (tiếng Việt)
- Anti-spam, anti-raid, anti-nuke
- Quản lý vai trò và quyền hạn
- Hệ thống cảnh báo và kiểm duyệt

### 🎮 **Giải Trí & Trò Chơi**
- Các trò chơi mini đa dạng
- Hệ thống level và kinh nghiệm
- Lệnh vui nhộn và hiệu ứng ảnh
- Hệ thống kinh tế ảo

### 🔧 **Tiện Ích**
- Tạo embed tùy chỉnh
- Hệ thống ticket và modmail
- Thống kê máy chủ real-time
- Tự động chào mừng/tạm biệt

## 🚀 Cài Đặt

### Bước 1: Chuẩn bị môi trường
```bash
# Clone repository
git clone https://github.com/Phuc710/dis_xi_trum.git
cd dis_xi_trum

# Cài đặt dependencies
npm install
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` với nội dung:
```env
TOKEN=your_bot_token_here
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_ID=your_bot_client_id
OPENWEATHER_API_KEY=your_weather_api_key
MAIN_CHANNEL_ID=your_main_channel_id
PHUCC_USER_ID=895512947013611530
GUILD_ID=your_guild_id
```

### Bước 3: Khởi chạy bot
```bash
# Chạy bot
npm start

# Hoặc với nodemon (development)
npm run dev
```

## 🌐 Deploy lên Render

1. Fork repository này về GitHub của bạn
2. Tạo tài khoản trên [Render.com](https://render.com)
3. Tạo Web Service mới và kết nối với repository
4. Thêm các biến môi trường vào Render
5. Deploy và enjoy!

### Chi tiết deploy lên Render:

**⚙️ Cấu hình Service:**
- **Environment:** Node
- **Build Command:** `npm install`  
- **Start Command:** `node index.js`
- **Health Check Path:** `/health`

**🔐 Environment Variables cần thiết:**
```
TOKEN=your_discord_bot_token
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_ID=your_discord_client_id
OPENWEATHER_API_KEY=your_weather_api_key
MAIN_CHANNEL_ID=your_main_channel_id
PHUCC_USER_ID=your_user_id
GUILD_ID=your_guild_id
NODE_ENV=production
```

**🚀 Bước deploy nhanh:**
1. Push code lên GitHub (đảm bảo có .gitignore)
2. Tạo Web Service trên Render
3. Connect với GitHub repo
4. Thêm environment variables
5. Deploy!

**📊 Monitoring:**
- Health check: `https://your-app.onrender.com/health`
- Status page: `https://your-app.onrender.com/`

## 📋 Lệnh Chính

### 🎵 Âm Nhạc
- `/play` - Phát nhạc từ YouTube/Spotify
- `/queue` - Xem hàng đợi nhạc
- `/skip` - Bỏ qua bài hát
- `/volume` - Điều chỉnh âm lượng
- `/loop` - Lặp bài hát/playlist

### 🛡️ Quản Lý
- `/ban` - Cấm thành viên
- `/kick` - Đuổi thành viên
- `/mute` - Câm thành viên
- `/warn` - Cảnh báo thành viên
- `/purge` - Xóa tin nhắn hàng loạt

### 🎮 Giải Trí
- `/8ball` - Quả cầu thần số 8
- `/meme` - Meme ngẫu nhiên
- `/joke` - Câu chuyện cười
- `/ship` - Tính độ hợp đôi
- `/game` - Các trò chơi mini

### 🔧 Tiện Ích
- `/serverinfo` - Thông tin máy chủ
- `/userinfo` - Thông tin người dùng
- `/avatar` - Xem avatar
- `/poll` - Tạo bình chọn
- `/remind` - Đặt lời nhắc

## 🎨 Tùy Chỉnh

Bot hỗ trợ nhiều tùy chỉnh:
- Thay đổi màu sắc embed
- Tùy chỉnh thông báo chào mừng
- Cấu hình hệ thống level
- Thiết lập kênh log riêng biệt

## 🤝 Đóng Góp

Mọi đóng góp đều được chào đón! Hãy:
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📞 Liên Hệ & Hỗ Trợ

- **Discord Server:** [https://discord.gg/cc9U4w6a](https://discord.gg/cc9U4w6a)
- **GitHub:** [https://github.com/Phuc710](https://github.com/Phuc710)
- **Website:** [https://phucdev.xo.je](https://phucdev.xo.je)
- **Developer:** Phucx

## 📄 Giấy Phép

Dự án này được phát hành dưới giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

<p align="center">
  <strong>🎵 Music Bot + Boo Agent • Made with ❤️ by Phucx • 2025</strong>
</p>

<p align="center">
  <em>Bot Discord đa năng dành riêng cho cộng đồng người Việt</em>
</p>
