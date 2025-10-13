/*
 * Embeds Quy Tắc - Boo Bot
 * Được tạo bởi Phucx
 */

const { EmbedBuilder } = require("discord.js");

// Định nghĩa các embed quy tắc
const ruleEmbeds = {
    // ------------------------------------------------------------------
    spam: new EmbedBuilder()
        .setColor("Red")
        .setTitle("🚫 Quy Tắc Chống Spam")
        .setDescription(
            "**1️⃣ Không nhắn tin quá mức:** Tránh gửi quá nhiều tin nhắn trong thời gian ngắn.\n" +
            "**2️⃣ Không spam biểu tượng cảm xúc:** Không làm ngập chat bằng emoji hoặc sticker.\n" +
            "**3️⃣ Không spam phản ứng (reactions):** Việc thêm/xóa phản ứng liên tục gây mất trật tự.\n" +
            "**4️⃣ Không spam tag:** Không gắn thẻ (tag) người dùng hoặc vai trò (roles) liên tục.\n" +
            "**5️⃣ Không bật Caps Lock:** Tránh gõ chữ IN HOA TOÀN BỘ vì nó bị coi là la hét."
        )
        .setFooter({ text: "Boo Bot • Được tạo bởi Phucx" })
        .setTimestamp(),

    // ------------------------------------------------------------------
    nsfw: new EmbedBuilder()
        .setColor("Red")
        .setTitle("🔞 Quy Tắc Nội Dung NSFW")
        .setDescription(
            "**1️⃣ Không có nội dung NSFW:** Nội dung người lớn bị nghiêm cấm tuyệt đối.\n" +
            "**2️⃣ Không có tài liệu gợi dục:** Tránh đăng tải hình ảnh hoặc văn bản có tính gợi dục.\n" +
            "**3️⃣ Giữ nội dung lành mạnh:** Máy chủ này chào đón mọi lứa tuổi.\n" +
            "**4️⃣ Không có avatar không phù hợp:** Ảnh đại diện phải phù hợp.\n" +
            "**5️⃣ Không thảo luận tình dục:** Giữ các cuộc trò chuyện sạch sẽ và tôn trọng."
        )
        .setFooter({ text: "Boo Bot • Được tạo bởi Phucx" })
        .setTimestamp(),

    // ------------------------------------------------------------------
    harassment: new EmbedBuilder()
        .setColor("Red")
        .setTitle("🛡️ Quy Tắc Quấy Rối & Bắt Nạt")
        .setDescription(
            "**1️⃣ Hãy tôn trọng:** Đối xử với tất cả thành viên bằng sự tử tế và tôn trọng.\n" +
            "**2️⃣ Không tấn công cá nhân:** Không nhắm vào cá nhân bằng lời lăng mạ hoặc đe dọa.\n" +
            "**3️⃣ Không Doxxing:** Tuyệt đối không chia sẻ thông tin cá nhân mà không có sự đồng ý.\n" +
            "**4️⃣ Không phân biệt đối xử:** Tôn trọng tất cả chủng tộc, giới tính, tôn giáo và xu hướng tính dục.\n" +
            "**5️⃣ Báo cáo vấn đề:** Sử dụng các kênh thích hợp để báo cáo hành vi quấy rối."
        )
        .setFooter({ text: "Boo Bot • Được tạo bởi Phucx" })
        .setTimestamp(),

    // ------------------------------------------------------------------
    advertising: new EmbedBuilder()
        .setColor("Red")
        .setTitle("📢 Quy Tắc Quảng Cáo")
        .setDescription(
            "**1️⃣ Không tự quảng cáo:** Không quảng cáo nội dung của bạn mà không được phép.\n" +
            "**2️⃣ Không mời tham gia máy chủ:** Không được đăng liên kết mời tham gia máy chủ Discord.\n" +
            "**3️⃣ Không quảng cáo qua DM:** Không gửi tin nhắn quảng cáo trực tiếp cho thành viên.\n" +
            "**4️⃣ Xin phép:** Liên hệ với quản trị viên trước khi chia sẻ bất kỳ nội dung quảng cáo nào.\n" +
            "**5️⃣ Sử dụng kênh được chỉ định:** Nếu được phép, chỉ sử dụng các kênh đã được quy định."
        )
        .setFooter({ text: "Boo Bot • Được tạo bởi Phucx" })
        .setTimestamp(),

    // ------------------------------------------------------------------
    general: new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📋 Quy Tắc Chung Của Máy Chủ")
        .setDescription(
            "**1️⃣ Tuân thủ Điều khoản Dịch vụ của Discord (ToS).**\n" +
            "**2️⃣ Sử dụng đúng kênh:** Đăng nội dung vào các kênh liên quan.\n" +
            "**3️⃣ Không sử dụng tài khoản phụ (alt accounts):** Mỗi người chỉ được dùng một tài khoản.\n" +
            "**4️⃣ Chỉ dùng tiếng Anh:** Giữ các cuộc trò chuyện bằng tiếng Anh để dễ dàng kiểm duyệt.\n" +
            "**5️⃣ Lắng nghe quản trị viên:** Làm theo hướng dẫn của người kiểm duyệt một cách nhanh chóng.\n" +
            "**6️⃣ Hãy vui vẻ:** Tận hưởng thời gian của bạn trong cộng đồng của chúng ta!"
        )
        .setFooter({ text: "Boo Bot • Được tạo bởi Phucx" })
        .setTimestamp(),

    // ------------------------------------------------------------------
    voice: new EmbedBuilder()
        .setColor("Green")
        .setTitle("🎤 Quy Tắc Kênh Thoại")
        .setDescription(
            "**1️⃣ Không spam mic:** Tránh gây tiếng ồn quá mức hoặc bật âm thanh lớn.\n" +
            "**2️⃣ Ưu tiên dùng Push-to-Talk:** Sử dụng tính năng \"nhấn để nói\" để tránh tiếng ồn nền.\n" +
            "**3️⃣ Hãy tôn trọng:** Đừng cắt lời hoặc nói chen ngang người khác liên tục.\n" +
            "**4️⃣ Không lạm dụng bot nghe nhạc:** Sử dụng bot nghe nhạc một cách có trách nhiệm.\n" +
            "**5️⃣ Nội dung phù hợp:** Giữ các cuộc trò chuyện thoại sạch sẽ và thân thiện."
        )
        .setFooter({ text: "Boo Bot • Được tạo bởi Phucx" })
        .setTimestamp(),

    // ------------------------------------------------------------------
    consequences: new EmbedBuilder()
        .setColor("Orange")
        .setTitle("⚖️ Vi Phạm Quy Tắc & Hậu Quả")
        .setDescription(
            "**Hệ Thống Cảnh Cáo:**\n" +
            "• **Lần vi phạm thứ 1:** Cảnh cáo bằng lời nói\n" +
            "• **Lần vi phạm thứ 2:** Cấm nói tạm thời (1-24 giờ)\n" +
            "• **Lần vi phạm thứ 3:** Cấm tham gia tạm thời (1-7 ngày)\n" +
            "• **Vi phạm nghiêm trọng:** Cấm vĩnh viễn ngay lập tức\n\n" +
            "**Quy Trình Kháng Nghị (Kháng cáo):**\n" +
            "Liên hệ với quản trị viên qua modmail để kháng nghị."
        )
        .setFooter({ text: "Boo Bot • Được tạo bởi Phucx" })
        .setTimestamp()
};

module.exports = ruleEmbeds;