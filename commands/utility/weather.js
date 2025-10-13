/*
 * Weather Command - Boo Bot
 * Made by Phucx
 * Hỗ trợ tìm kiếm thông minh địa điểm Việt Nam
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Map địa danh Việt Nam phổ biến (không dấu -> có dấu + tiếng Anh chuẩn)
const vietnameseLocationMap = {
    // Thành phố lớn
    'ha noi': 'Hanoi',
    'hanoi': 'Hanoi',
    'ho chi minh': 'Ho Chi Minh City',
    'hcm': 'Ho Chi Minh City',
    'sai gon': 'Ho Chi Minh City',
    'saigon': 'Ho Chi Minh City',
    'da nang': 'Da Nang',
    'danang': 'Da Nang',
    'can tho': 'Can Tho',
    'cantho': 'Can Tho',
    'hai phong': 'Hai Phong',
    'haiphong': 'Hai Phong',
    'nha trang': 'Nha Trang',
    'nhatrang': 'Nha Trang',
    'hue': 'Hue',
    'vung tau': 'Vung Tau',
    'vungtau': 'Vung Tau',
    'da lat': 'Da Lat',
    'dalat': 'Da Lat',
    'bien hoa': 'Bien Hoa',
    'bienhoa': 'Bien Hoa',
    'long xuyen': 'Long Xuyen',
    'longxuyen': 'Long Xuyen',
    'ha long': 'Ha Long',
    'halong': 'Ha Long',
    'nam dinh': 'Nam Dinh',
    'namdinh': 'Nam Dinh',
    'thai nguyen': 'Thai Nguyen',
    'thainguyen': 'Thai Nguyen',
    'phan thiet': 'Phan Thiet',
    'phanthiet': 'Phan Thiet',
    'rach gia': 'Rach Gia',
    'rachgia': 'Rach Gia',
    'ca mau': 'Ca Mau',
    'camau': 'Ca Mau',
    'soc trang': 'Soc Trang',
    'soctrang': 'Soc Trang',
    'vinh': 'Vinh',
    'quy nhon': 'Quy Nhon',
    'quynhon': 'Quy Nhon',
    'buon ma thuot': 'Buon Ma Thuot',
    'buonmathuot': 'Buon Ma Thuot',
    'pleiku': 'Pleiku',
    'my tho': 'My Tho',
    'mytho': 'My Tho',
    'tuy hoa': 'Tuy Hoa',
    'tuyhoa': 'Tuy Hoa',
    
    // Quận/Huyện HCM
    'quan 1': 'District 1, Ho Chi Minh City',
    'quan 2': 'District 2, Ho Chi Minh City',
    'quan 3': 'District 3, Ho Chi Minh City',
    'quan 4': 'District 4, Ho Chi Minh City',
    'quan 5': 'District 5, Ho Chi Minh City',
    'quan 6': 'District 6, Ho Chi Minh City',
    'quan 7': 'District 7, Ho Chi Minh City',
    'quan 8': 'District 8, Ho Chi Minh City',
    'quan 9': 'District 9, Ho Chi Minh City',
    'quan 10': 'District 10, Ho Chi Minh City',
    'quan 11': 'District 11, Ho Chi Minh City',
    'quan 12': 'District 12, Ho Chi Minh City',
    'binh thanh': 'Binh Thanh, Ho Chi Minh City',
    'binhthanh': 'Binh Thanh, Ho Chi Minh City',
    'tan binh': 'Tan Binh, Ho Chi Minh City',
    'tanbinh': 'Tan Binh, Ho Chi Minh City',
    'phu nhuan': 'Phu Nhuan, Ho Chi Minh City',
    'phunhuan': 'Phu Nhuan, Ho Chi Minh City',
    'go vap': 'Go Vap, Ho Chi Minh City',
    'govap': 'Go Vap, Ho Chi Minh City',
    'binh tan': 'Binh Tan, Ho Chi Minh City',
    'binhtan': 'Binh Tan, Ho Chi Minh City',
    'tan phu': 'Tan Phu, Ho Chi Minh City',
    'tanphu': 'Tan Phu, Ho Chi Minh City',
    'thu duc': 'Thu Duc, Ho Chi Minh City',
    'thuduc': 'Thu Duc, Ho Chi Minh City',
    'cu chi': 'Cu Chi, Ho Chi Minh City',
    'cuchi': 'Cu Chi, Ho Chi Minh City',
    'hoc mon': 'Hoc Mon, Ho Chi Minh City',
    'hocmon': 'Hoc Mon, Ho Chi Minh City',
    'binh chanh': 'Binh Chanh, Ho Chi Minh City',
    'binhchanh': 'Binh Chanh, Ho Chi Minh City',
    'nha be': 'Nha Be, Ho Chi Minh City',
    'nhabe': 'Nha Be, Ho Chi Minh City',
    'can gio': 'Can Gio, Ho Chi Minh City',
    'cangio': 'Can Gio, Ho Chi Minh City',
};

// Hàm chuẩn hóa tên địa điểm
function normalizeLocation(location) {
    if (!location || typeof location !== 'string') {
        return 'Ho Chi Minh City'; // Default
    }
    
    // Chuyển về chữ thường và bỏ dấu tiếng Việt
    const normalized = location.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .trim();
    
    // Tìm trong map
    return vietnameseLocationMap[normalized] || location;
}

// Hàm lấy icon thời tiết phù hợp
function getWeatherIcon(condition) {
    const icons = {
        'clear sky': '☀️',
        'few clouds': '🌤️',
        'scattered clouds': '⛅',
        'broken clouds': '☁️',
        'overcast clouds': '☁️',
        'shower rain': '🌧️',
        'rain': '🌧️',
        'light rain': '🌦️',
        'thunderstorm': '⛈️',
        'snow': '❄️',
        'mist': '🌫️',
        'fog': '🌫️',
        'haze': '🌫️',
        'smoke': '🌫️',
        'dust': '🌫️',
    };
    
    const lowerCondition = condition.toLowerCase();
    for (const key in icons) {
        if (lowerCondition.includes(key)) {
            return icons[key];
        }
    }
    return '🌍';
}

// Hàm dịch mô tả thời tiết sang tiếng Việt
function translateWeatherDescription(description) {
    const translations = {
        'clear sky': 'Trời quang đãng',
        'few clouds': 'Ít mây',
        'scattered clouds': 'Mây rải rác',
        'broken clouds': 'Nhiều mây',
        'overcast clouds': 'U ám',
        'shower rain': 'Mưa rào',
        'rain': 'Mưa',
        'light rain': 'Mưa nhẹ',
        'moderate rain': 'Mưa vừa',
        'heavy intensity rain': 'Mưa to',
        'very heavy rain': 'Mưa rất to',
        'extreme rain': 'Mưa cực lớn',
        'thunderstorm': 'Giông bão',
        'thunderstorm with light rain': 'Giông có mưa nhẹ',
        'thunderstorm with rain': 'Giông mưa',
        'thunderstorm with heavy rain': 'Giông mưa lớn',
        'light thunderstorm': 'Giông nhẹ',
        'heavy thunderstorm': 'Giông mạnh',
        'snow': 'Tuyết',
        'light snow': 'Tuyết nhẹ',
        'heavy snow': 'Tuyết lớn',
        'sleet': 'Mưa tuyết',
        'mist': 'Sương mù',
        'fog': 'Sương mù dày',
        'haze': 'Sương khói',
        'smoke': 'Khói',
        'dust': 'Bụi',
        'sand': 'Cát',
        'tornado': 'Lốc xoáy',
        'squalls': 'Gió giật',
        'windy': 'Gió mạnh',
    };
    
    const lowerDesc = description.toLowerCase();
    return translations[lowerDesc] || description;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Xem dự báo thời tiết tại các địa điểm Việt Nam')
        .addStringOption(option =>
            option.setName('location')
                .setDescription('Nhập tên địa điểm (VD: Hà Nội, Củ Chi, Gò Vấp, HCM)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const location = interaction.options.getString('location');
        const apiKey = process.env.OPENWEATHER_API_KEY || '79ee2632d30cf61548eeea1fef196424';

        // Chuẩn hóa địa điểm
        const searchLocation = normalizeLocation(location);
        
        await interaction.deferReply();

        try {
            // Gọi API OpenWeather
            const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    q: `${searchLocation},VN`, // Thêm VN để ưu tiên Việt Nam
                    appid: apiKey,
                    units: 'metric',
                    lang: 'vi'
                }
            });

            const data = response.data;

            // Tạo embed
            const weatherEmbed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle(`${getWeatherIcon(data.weather[0].description)} Thời Tiết tại ${data.name}`)
                .setDescription(`**${translateWeatherDescription(data.weather[0].description)}**`)
                .addFields(
                    { 
                        name: '🌡️ Nhiệt Độ', 
                        value: `${Math.round(data.main.temp)}°C (Cảm giác như ${Math.round(data.main.feels_like)}°C)`, 
                        inline: true 
                    },
                    { 
                        name: '📊 Min/Max', 
                        value: `${Math.round(data.main.temp_min)}°C / ${Math.round(data.main.temp_max)}°C`, 
                        inline: true 
                    },
                    { 
                        name: '💧 Độ Ẩm', 
                        value: `${data.main.humidity}%`, 
                        inline: true 
                    },
                    { 
                        name: '💨 Gió', 
                        value: `${data.wind.speed} m/s`, 
                        inline: true 
                    },
                    { 
                        name: '🔍 Tầm Nhìn', 
                        value: `${(data.visibility / 1000).toFixed(1)} km`, 
                        inline: true 
                    },
                    { 
                        name: '🌍 Khí Áp', 
                        value: `${data.main.pressure} hPa`, 
                        inline: true 
                    }
                )
                .setThumbnail(`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
                .setFooter({ 
                    text: `Boo Bot • Cập nhật: ${new Date(data.dt * 1000).toLocaleString('vi-VN')}` 
                })
                .setTimestamp();

            // Thêm thông tin bình minh/hoàng hôn nếu có
            if (data.sys.sunrise && data.sys.sunset) {
                const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                weatherEmbed.addFields({
                    name: '🌅 Bình Minh / Hoàng Hôn',
                    value: `${sunrise} / ${sunset}`,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [weatherEmbed] });

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu thời tiết:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi')
                .setDescription(
                    error.response?.status === 404
                        ? `Không tìm thấy địa điểm **"${location}"**.\n\n` +
                          `💡 **Gợi ý:** Thử nhập:\n` +
                          `• Tên thành phố: Hà Nội, Đà Nẵng, HCM\n` +
                          `• Tên quận/huyện: Gò Vấp, Củ Chi, Quận 1\n` +
                          `• Viết không dấu: Ha Noi, Cu Chi, Go Vap`
                        : `Đã xảy ra lỗi khi lấy dữ liệu thời tiết. Vui lòng thử lại sau!`
                )
                .setFooter({ text: 'Boo Bot • Made by Phucx' })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
