const { Translate } = require('../process_tools');

module.exports = async ({ inter, queue }) => {
  if (!queue?.isPlaying())
    return inter.editReply({
      content: await Translate(`Hiện tại không có bài nhạc nào đang phát... thử lại nhé <❌>`),
    });
  if (!queue.history.previousTrack)
    return inter.editReply({
      content: await Translate(`Không có bài hát nào được phát trước đó <${inter.member}>... try again ? <❌>`),
    });

  await queue.history.back();

  inter.editReply({
    content: await Translate(`Đang phát lại bài hát **trước đó** <✅>`),
  });
};
