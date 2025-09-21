const { Translate } = require('../../process_tools');

module.exports = async (client) => {
    console.log(await Translate(`Client good <${client.user.username}>.`));
    console.log(await Translate("vào Việc Thôi !"));
    
    client.user.setActivity(client.config.app.playing);
}