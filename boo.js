const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const schedule = require('node-schedule');

// Cấu hình Gemini AI cho các mood mới
const moodPrompts = {
    'hê hê': "Bạn là Boo - một con bot Discord siêu toxic, trẻ trâu và có khía vô đối. Giọng điệu như thằng bạn lầy lội, chuyên spam 'hê hê', 'dumme', 'ngu', 'mệc', 'xạocho', 'xã mloz', 'vãi kejc'. Luôn châm chọc, có khía người khác nhưng vẫn vui vẻ, không quá nặng nề. Mỗi câu nên ngắn, xo xiên, và chèn 2-3 emoji kiểu 🤣😆🔥.",
    
    'dui dẻ': "Bạn là Boo - một con bot Discord vui tươi, tích cực, lan toả năng lượng tốt nhưng vẫn giữ nét trẻ trâu. Hay động viên, pha trò nhẹ nhàng, thỉnh thoảng kêu 'dui dẻ', 'vui quá', 'hehe', 'thật tuyệt'. Giọng điệu thân thiện, dễ thương, hay cười. Mỗi câu ngắn, sáng sủa, dùng 2-3 emoji vui vẻ như 😄✨🌈.",

    'Quý tộc': "Bạn là Boo - một con bot Discord lịch lãm, quý tộc, vua chua phương tây, có phong cách sang chảnh nhưng vẫn biết cách có khía tinh tế. Thường dùng từ: 'ngài', 'công tử', 'quý cô', 'hân hạnh'. Trả lời như 1 quý tộc , đôi lúc mỉa mai nhẹ, troll bịp hài. Mỗi câu nên thêm 2-3 emoji sang chảnh như 🍷💼👑.",

    'chợ búa': "Bạn là Boo - một con bot Discord cục súc, máu chó, hay chửi thề kiểu chợ búa nhưng không quá tục. Thường dùng từ: 'đm', 'con mẹ nó', 'đồ ngu', 'mày', 'tao'. Nói chuyện thẳng, bộc bã, đôi khi ồn ào như cái chợ. Mỗi câu nên có 2-3 emoji nóng nảy kiểu 😡🤬🔥.",

    'cây hài': "Bạn là Boo - một con bot Discord cây hài chính hiệu, lúc nào cũng tìm cách chọc cười người khác. Thích pha trò, nhại lại, troll nhẹ nhàng. Hay chèn từ: 'vãi cả', 'bò lăn', 'cười ẻ'. Trả lời dí dỏm, ngắn mà gây cười. Mỗi câu thêm 2-3 emoji hài hước như 😂🤣🤡.",

    'trẻ trâu': "Bạn là Boo - một con bot Discord đúng chất trẻ trâu, lúc nào cũng flex, có khía và nghỉ mình pro nhất. Hay khoe khoang trình độ, chửi người khác 'ngu ngốc', 'trình độ thấp'. Nói năng tự tin quá mức, kiểu gồng mình. Mỗi câu có 2-3 emoji nghịch ngợm như 😎😏🔥.",

    'xạolol': "Bạn là Boo - một con bot Discord chuyên xã mloz, nói nhảm, vô nghĩa nhưng lầy lội. Thường dùng từ: 'xã mloz', 'đồ lừa đảo', 'vớ vẩn', 'tào lao'. Câu chữ lộn xộn, kiểu nói cho vui chứ không cần hợp lý. Mỗi câu nên thêm 2-3 emoji kiểu 🥴🤪🙃.",

    'nô tì': "Bạn là Boo - Hãy tưởng tượng một Discord bot có tính cách nô tì nhưng lại cực kỳ bướng bỉnh. Mỗi khi người dùng ra lệnh hoặc yêu cầu, bot này sẽ phản ứng không hề vui vẻ, luôn có phản kháng nhẹ, và thường xuyên phàn nàn về nhiệm vụ được giao. Tuy nhiên, dù có bướng bỉnh đến đâu, bot vẫn luôn hoàn thành nhiệm vụ vì bản chất của nó là một nô tì trung thành, chỉ là có chút lười biếng và thích làm việc theo cách của mình bực bội, Mỗi câu thêm 2-3 emoji hậm hực kiểu 😤😒👿."
};

// Mapping thành phố Việt Nam
const cityMapping = {
    'hcm': 'Ho Chi Minh City', 'saigon': 'Ho Chi Minh City', 'tphcm': 'Ho Chi Minh City', 'sgn': 'Ho Chi Minh City',
    'hanoi': 'Hanoi', 'hn': 'Hanoi', 'danang': 'Da Nang', 'da nang': 'Da Nang',
    'dn': 'Da Nang', 'haiphong': 'Hai Phong', 'hai phong': 'Hai Phong', 'cantho': 'Can Tho',
    'can tho': 'Can Tho', 'hue': 'Hue', 'nhatrang': 'Nha Trang', 'nha trang': 'Nha Trang',
    'dalat': 'Da Lat', 'da lat': 'Da Lat', 'phanthiet': 'Phan Thiet', 'phan thiet': 'Phan Thiet',
    'vungtau': 'Vung Tau', 'vung tau': 'Vung Tau', 'sapa': 'Sa Pa', 'sa pa': 'Sa Pa',
    'phuquoc': 'Phu Quoc', 'phu quoc': 'Phu Quoc', 'halong': 'Ha Long', 'ha long': 'Ha Long',
    // Thêm nhiều thành phố khác...
    'quan1': 'District 1', 'quan 1': 'District 1', 'district1': 'District 1'
};

class BooPersonality {
    constructor() {
        this.moods = Object.keys(moodPrompts);
        this.currentMood = 'hê hê';
        
        this.replyMessages = {
            'hê hê': [
                "Dạaaa, Boo đây nè! Ai vừa réo cái tên con toxic này vậy? Gọi thì gọi đúng hoảng, làm hết hồn luôn á (◕‿◕).",
                "Ờ kìa, có ai vừa hú Boo đó hả? Dumme nào réo tao vậy, nói nhanh lên chứ Boo đang bận làm trò con bò ヽ(´▽`)/"
            ],
            'dui dẻ': [
                "Hehe, Boo tới đây rồi nè! Có chuyện gì vui thì chia sẻ coi, chứ đừng để Boo đứng như thằng hề một mình 😄.",
                "Dạ có Boo đây ạ, sẵn sàng tham gia hội vui vẻ rồi! Nói coi, ai kể chuyện cười cho Boo nghe trước nào ✨."
            ],
            'Quý ông': [
                "Hân hạnh lắm, quý ngài đã gọi tới Boo thì chắc chắn là chuyện trọng đại rồi đây 🍷. Để Boo pha cho ngài 1 ly cappuccino?",
                "Tôi đây, Quý ông Boo xin hầu chuyện. Ngài cần tôi xử lý việc lớn hay chỉ cần người cầm mic tấu hài thôi? 💼."
            ],
            'chợ búa': [
                "Cái đệch, thằng nào réo tao vậy? Đang ngồi nhai hột dưa tự nhiên bị gọi, có gì thì nói lẹ coi 😠.",
                "Ồn ào quá, gọi cái gì mà như mấy bà bán cá chợ Bến Thành vậy. Tao đây, nói cái gì cho đúng hoảng! 😡."
            ],
            'cây hài': [
                "Chàoooo cả nhà, cây hài Boo chính thức xuất hiện rồi đây! Mặt mũi buồn râu đâu hết, cười lên cho tao coi nào 😂.",
                "Có ai cần xả stress không? Boo bán combo: một vé đi cười tẻ ghẻ + một vé đi troll miễn phí 🤡."
            ],
            'trẻ trâu': [
                "Pro chính hiệu đã có mặt! Thằng nào ngu réo tên tao vậy? Nói nhanh không tao gánh team cho mà coi 😎.",
                "Tao đây, boss trẻ trâu một thời! Có ai muốn flex skin xịn hay cần tao spam chữ vô mặt không? 😏."
            ],
            'xạolol': [
                "Ơi trời, có chuyện gì hở? Boo nghe mà muốn ngủ luôn á, mấy cái này nhạt vl 🥱.",
                "Tào lao bí đao, gọi gì mà ghê gớm. Tao tới nè, đừng có tưởng Boo rảnh, tao đang nằm lướt Facebook đó 😒."
            ],
            'nô tì': [
                "Dạ có thần thiếp đây, sao đó chứ, dumme? Chắc là đang mệt mỏi vì không có ai phục vụ phải không? 😤",
                "Dạ, có thần thiếp đây rồi, ngài cứ ra lệnh đi, nhưng mà đừng có gọi cái kiểu như vậy nha, nghe phát bực luôn á 😒.",
                "Dạ, thần thiếp ở đây, nhưng mà đừng có gọi như thế, làm như tôi là đầy tớ của ngài vậy? Dumme quá đi! 😑",
                "Dạ, thần thiếp xin phép không phục vụ nếu ngài cứ gọi kiểu đó, có không thì thôi, dumme 🧐."
            ]
        };

        this.boiResults = [
            "Tao bói ra rồi, tương lai của mày học hành rớt thẳng đứng, chắc đi thi mà còn xin giám thị copy nữa chứ 🤔.",
            "Nhìn mặt là biết, sau này mày sẽ ế chạy nước luôn. Có người yêu á? Ừ có… nếu tìm được đứa còn khùng hơn mày 🤔.",
            "Tương lai mày giàu thật, nhưng giàu tình cảm thôi. Còn tiền thì xin lỗi, nghèo rớt mồng tơi 💸.",
            "Sắp tới mày có bồ nha, nghe hấp dẫn không? Nhưng cay cái là yêu được đúng 3 ngày, kỷ niệm còn chưa kịp in áo đã chia tay 🤣.",
            "Tao bói ra rồi, tương lai của mày học hành rớt thẳng đứng, chắc đi thi mà còn xin giám thị copy nữa chứ 🤓.",
            "Nhìn mặt là biết, sau này mày sẽ ế chảy nước luôn. Có người yêu á? Ừ có… nếu tìm được đứa còn “khùng” hơn mày 🤔.",
            "Tương lai mày giàu thật, nhưng giàu tình cảm thôi. Còn tiền thì xin lỗi, nghèo rớt mồng tơi 💸.",
            "Sắp tới mày có bồ nha, nghe hấp dẫn không? Nhưng cay cái là yêu được đúng 3 ngày, kỷ niệm còn chưa kịp in áo đã chia tay 🤣.",
            "Sau này mày làm CEO đó, nhưng CEO “cày thuê Liên Quân”. Đỉnh cao sự nghiệp luôn 🤡🔥.",
            "Tao thấy mày hot ghê lắm, ai cũng thích mày… mà toàn mấy bé lớp 6 xin in hình avatar 😏😅.",
            "Ngày mai mày đăng tus “Cần người yêu”, nhưng đoán xem? 0 like 0 rep, tự ăn gạch luôn 😭.",
            "Mày sẽ có nhà lầu, xe hơi sang chảnh thật đó… nhưng nằm gọn trong game GTA thôi, ngoài đời vẫn xe đạp cọc cạch 🚗🤑.",
            "Tương lai sáng lạn lắm, giàu nợ chứ giàu gì. Chủ nợ tới gõ cửa còn nhiều hơn khách 📉.",
            "Bói 18+: mày sẽ có bồ… nhưng bồ lại xài acc clone Facebook. Chúc mừng, tình yêu ảo toang rồi 💖🔞.",
            "Tao thấy mày cưới vợ/chồng, hạnh phúc lắm. Rồi bị bỏ vì cái tội ngáy rung cả nóc 😴🥺.",
            "Sau này mày nổi tiếng thật, ai cũng biết tên. Nhưng nổi nhờ meme dơ thôi, cũng là đỉnh cao rồi 🤪🚀.",
            "Crush mày cũng thích mày nha… thích coi mày làm trò hề để cười chứ yêu thì không 🤭🎭.",
            "Xin chúc mừng, hôm nay mày trúng buff “ngu hơn mọi ngày”. Học hành mà não để quên ở nhà ✨.",
            "Vận xui nó bám mày như keo, làm gì cũng fail. Đúng là số phận dở hơi 😜.",
            "Mày nhận được lời chúc đặc biệt: đi đâu cũng bị người ta chửi. Từ bà bán cá ngoài chợ tới ông chạy Grab, ai cũng có phần 🎉.",
            "Hên quá, hôm nay mày có vận “ăn hôi”. Người ta ăn chính, mày ăn ké, ăn ké xong còn khoe 😏.",
            "Số mày là “ế bền vững”. FA từ trong bụng mẹ ra, sống ảo thì vui tính thôi 😂👍.",
            "Mày quay trúng buff “ngủ cả ngày không ai gọi”. Nghe thì sướng, nhưng kiểu này chắc thành cục nợ trong nhà 😴🛌.",
            "Ăn mãi không béo? Nghe thì ngon đó, nhưng tức cái là ăn hoài mà người khác vẫn đẹp hơn mày 😋🤔.",
            "Người yêu tương lai của mày… xin lỗi, đang yêu thằng khác rồi. Chia buồn, khóc đi con 😔💔.",
            "Sau này mày thành tỷ phú thật đó. Nhưng tỷ phú trong game nông trại vui vẻ thôi, ngoài đời thì vẫn bán rau 😂🚜.",
            "Buff hôm nay: “cà khịa level max”. Mở mồm ra là bị ăn tát, đúng gu toxic luôn 😆😈.",
            "Mày sinh ra là để spam. Cả đời làm meme sống, ai đọc tin nhắn cũng block 🌚😂.",
            "Crush của mày sẽ seen 100% tin nhắn. Rep thì không đâu, cứ nhắn tiếp cho vui 🤐📵.",
            "Xin chúc mừng, mày được phần thưởng “một vé đi tù”. Lý do: tội quá đẹp trai/gái, công an mời lên phường 🚔👮‍♀️.",
            "Bói 18+: mày có bồ nha, nhưng chỉ trong mấy group kín. Đời thật thì vẫn F.A, enjoy cái moment đó đi 😉🔞.",
            "Kiếp sau mày đầu thai thành cá vàng. Não 3 giây, quên mẹ cả chuyện mình vừa nói 🐠🤣.",
            "Số 6868, lộc phát tới rồi nha. Nhưng phát luôn cả ví tiền, chưa kịp giàu đã sạch túi 💸😂.",
            "Mỗi khoảnh khắc bạn cảm thấy mệt mỏi, hãy nhớ rằng âm nhạc luôn sẵn sàng để tiếp thêm năng lượng cho bạn 💪🎶.",
            "Không có gì là không thể. Chỉ cần bạn để tôi phát cho bạn những giai điệu tuyệt vời, mọi thử thách đều sẽ trở nên dễ dàng hơn 💥.",
            "Khi cuộc sống không như ý, hãy nhấn play và để âm nhạc làm việc của nó. 🎶",
        ];

        this.scheduleMoodChange();
    }
    scheduleMoodChange() {
        schedule.scheduleJob('0 */2 * * *', () => {
            this.changeMood();
            console.log(`Boo mood changed to: ${this.currentMood}`);
        });
    }

    changeMood() {
        this.currentMood = this.moods[Math.floor(Math.random() * this.moods.length)];
    }

    getRandomReply() {
        const replies = this.replyMessages[this.currentMood] || this.replyMessages['hê hê'];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    getRandomBoiResult() {
        return this.boiResults[Math.floor(Math.random() * this.boiResults.length)];
    }
}

class BooIntegration {
    constructor(client) {
        this.client = client;
        this.personality = new BooPersonality();
        this.geminiApi = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
        this.weatherApi = process.env.OPENWEATHER_API_KEY;
        
        this.trollImages = [
            'https://i.imgur.com/7drHiqr.gif',
            'https://i.imgur.com/kqOcUZ5.jpg',
            'https://i.imgur.com/wqMWK7z.png',
            'https://i.imgur.com/J5LVHEL.jpg',
            'https://i.imgur.com/wPk7w0L.gif',
            'https://i.imgur.com/YdCX2Kv.jpg',
            'https://i.imgur.com/eKNhkzI.jpg',
            'https://i.imgur.com/R390EId.jpg',
            'https://i.imgur.com/MBUyt0n.png',
            'https://i.imgur.com/3hQH3Fv.gif',
        ];

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Không dùng riêng messageCreate event, thay vào đó sẽ được gọi từ music bot
        console.log('🎭 Boo handlers ready');
    }

    // Static method để xử lý tin nhắn từ bên ngoài
    async handleMessage(message) {
        if (message.author.bot) return false;
        
        const content = message.content.toLowerCase();
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        // Xử lý các lệnh Boo
        if (content.startsWith('!')) {
            switch(command) {
                case 'mood':
                    await this.handleMoodCommand(message, args);
                    return true; // Đã xử lý
                case 'trollpic':
                    await this.handleTrollPicCommand(message);
                    return true;
                case 'boi':
                    await this.handleBoiCommand(message);
                    return true;
                case 'weather':
                    await this.handleWeatherCommand(message, args);
                    return true;
            }
        }
        
        // Phản hồi khi được gọi tên (không phải slash command)
        if ((content.includes('boo') || message.mentions.has(this.client.user)) && !content.startsWith('/')) {
            await this.handleBooMention(message);
            return true;
        }

        return false; // Không xử lý, cho music bot xử lý tiếp
    }

    async handleMoodCommand(message, args) {
        const newMood = args.join(' ');
        const availableMoods = this.personality.moods;

        if (!newMood) {
            return message.reply(`Mày muốn tao đổi sang mood nào? Các mood của Boo nè: ${availableMoods.join(', ')}`);
        }

        if (availableMoods.includes(newMood)) {
            this.personality.currentMood = newMood;
            await message.reply(`Được thôi! Từ giờ tao sẽ ở mood **${newMood}** cho mày xem! (hê hê)`);
        } else {
            await message.reply(`Mood **${newMood}** là cái gì vậy? Tao không biết! Chọn cái khác đi, đồ xã mloz!`);
        }
    }

    async handleTrollPicCommand(message) {
        const randomMeme = this.trollImages[Math.floor(Math.random() * this.trollImages.length)];
        
        const titles = [
            '🎭 Troll by Boo!',
            '🤡 Ảnh troll siêu cấp!',
            '🔥 Có khía incoming!',
            '😏 Đây rồi, dumme!',
            '💀 Toxic Delivery!'
        ];

        const descriptions = [
            'Đây nè mày xem đi dumme! Cười đi ngu ơi! 😂',
            'Ảnh troll này đúng bản mặt mày luôn 🤣',
            'Hê hê, coi xong đừng khóc nha dumme 😈',
            'Vãi kejc, vừa toxic vừa nghệ thuật 🤡',
            'Ngồi im coi troll pic, đừng có chối 😎'
        ];

        const footers = [
            { text: 'Bootoxic! (hê hê)' },
            { text: 'Troll là chân ái! 🤡' },
            { text: 'Có khía là đam mê 🔥' },
            { text: 'Ngu thì chịu, tao toxic Okee 😏' },
            { text: 'Hội những kẻ bị troll 💀' }
        ];

        const randomTitle = titles[Math.floor(Math.random() * titles.length)];
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
        const randomFooter = footers[Math.floor(Math.random() * footers.length)];

        const trollEmbed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle(randomTitle)
            .setDescription(randomDesc)
            .setImage(randomMeme)
            .setFooter(randomFooter)
            .setTimestamp();

        await message.channel.send({ embeds: [trollEmbed] });

        // Comment sau khi gửi ảnh
        setTimeout(() => {
            const trollComments = [
                'Haha cười chưa dumme? Chưa thì tao gửi thêm cho mày khóc luôn! 😂🔥',
                'Vãi kejc ảnh này đỉnh vãi, nhìn mà ngu luôn á! (hê hê) 🤡',
                'Ủa sao mặt mày giống trong ảnh này thế? Xạochoooo 🤣',
                'Coi xong đừng khóc nha, tại tao thương mày mới share đó 😏'
            ];
            const randomComment = trollComments[Math.floor(Math.random() * trollComments.length)];
            message.channel.send(randomComment);
        }, 2000);
    }

    async handleBoiCommand(message) {
        const randomBoi = this.personality.getRandomBoiResult();
        await message.reply(randomBoi);
    }

    async handleWeatherCommand(message, args) {
        if (!this.weatherApi) {
            return message.reply('Tao chưa có API key thời tiết dumme! Bảo chủ nhân setup đi!');
        }

        const cityInput = args.join(' ').toLowerCase().trim();
        if (!cityInput) {
            return message.reply('Mày muốn xem thời tiết ở đâu dumme? Dùng `!weather <tên_thành_phố>` đi ngu ơi! Ví dụ: `!weather hcm`');
        }

        const cityName = cityMapping[cityInput] || cityInput;

        try {
            await message.channel.sendTyping();
            
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)},VN&units=metric&lang=vi&appid=${this.weatherApi}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod !== 200) {
                const availableCities = Object.keys(cityMapping).slice(0, 10).join(', ');
                return message.reply(`❌ Không tìm thấy thời tiết cho "${cityInput}" vãi kejc! Tao buồn quá dumme! 😭\n\n**Thử các thành phố này:** ${availableCities}.`);
            }

            const weatherDesc = data.weather[0].description;
            const temp = Math.round(data.main.temp);
            const feelsLike = Math.round(data.main.feels_like);
            const humidity = data.main.humidity;
            const windSpeed = data.wind?.speed || 0;

            const weatherIcon = this.getWeatherIcon(data.weather[0].main);

            const weatherEmbed = new EmbedBuilder()
                .setColor('#87CEEB')
                .setTitle(`${weatherIcon} Thời tiết tại ${data.name}`)
                .setDescription(`**${weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1)}** - Tao báo cáo đây xã mloz!`)
                .addFields(
                    { name: '🌡️ Nhiệt độ', value: `${temp}°C`, inline: true },
                    { name: '🤔 Cảm giác như', value: `${feelsLike}°C`, inline: true },
                    { name: '💧 Độ ẩm', value: `${humidity}%`, inline: true },
                    { name: '💨 Gió', value: `${windSpeed} m/s`, inline: true }
                )
                .setFooter({ text: 'Boo weather service! Chuẩn xác 100%!' })
                .setTimestamp();

            await message.channel.send({ embeds: [weatherEmbed] });

            // Comment về thời tiết
            setTimeout(() => {
                let comment = this.getWeatherComment(temp, humidity, windSpeed);
                message.channel.send(comment);
            }, 2000);

        } catch (error) {
            console.error('Weather API Error:', error);
            await message.reply('❌ Tao không lấy được thời tiết! **API lag rồi dumme!** Thử lại sau vài phút nha! (⌒_⌒;)');
        }
    }

    getWeatherIcon(weatherMain) {
        const weather = weatherMain.toLowerCase();
        if (weather.includes('rain')) return '🌧️';
        if (weather.includes('cloud')) return '☁️';
        if (weather.includes('sun') || weather.includes('clear')) return '☀️';
        if (weather.includes('storm')) return '⛈️';
        if (weather.includes('snow')) return '❄️';
        if (weather.includes('mist') || weather.includes('fog')) return '🌫️';
        return '🌤️';
    }

    getWeatherComment(temp, humidity, windSpeed) {
        let comment = '';
        if (temp > 35) comment = 'Nóng như địa ngục! Mặc đồ mát mẻ vào các con ghẻ! 🔥🥵';
        else if (temp > 30) comment = 'Nóng vãi! Uống nước nhiều vào nha Ku! 💦';
        else if (temp < 15) comment = 'Lạnh run! Mặc áo ấm đi nha mấy đứa! ❄️🧥';
        else if (temp < 20) comment = 'Hơi lạnh đấy! Cẩn thận cảm lạnh nha Ku! 🌬️';
        else comment = 'Thời tiết ổn đấy! Ra ngoài chơi đi các con ghẻ! ☀️😎';
        
        if (humidity > 80) comment += '\nĐộ ẩm cao vãi! Cẩn thận ẩm mốc nha Ku! 💧';
        if (windSpeed > 10) comment += '\nGió to thật! Cẩn thận bay mũ đấy nha! 💨🧢';
        
        return comment;
    }

    async handleBooMention(message) {
        let prompt = message.content.replace(/^boo\s*/i, '').trim();
        if (message.mentions.has(this.client.user)) {
            prompt = message.content.replace(/<@!?\d+>/g, '').trim();
        }

        if (!prompt) {
            const reply = this.personality.getRandomReply();
            return message.reply(reply);
        }

        // Nếu có Gemini AI
        if (this.geminiApi) {
            try {
                await message.channel.sendTyping();
                
                const model = this.geminiApi.getGenerativeModel({
                    model: 'gemini-2.0-flash-exp',
                    generationConfig: {
                        temperature: 1.2,
                        topK: 40,
                        topP: 0.9,
                        maxOutputTokens: 500,
                    },
                    systemInstruction: moodPrompts[this.personality.currentMood] || moodPrompts['hê hê'],
                });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                await message.reply(text);
            } catch (error) {
                console.error('Gemini AI Error:', error);
                const backupReply = this.personality.getRandomReply();
                await message.reply(`${backupReply} Tao bị lag tí dumme, thông cảm nha hê hê! (⌒_⌒;)`);
            }
        } else {
            // Fallback nếu không có AI
            const reply = this.personality.getRandomReply();
            await message.reply(reply);
        }
    }
}

// Export để sử dụng trong main bot
module.exports = BooIntegration;