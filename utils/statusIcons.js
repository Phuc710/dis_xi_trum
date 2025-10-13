const path = require('path');
const { AttachmentBuilder } = require('discord.js');

const statusIconPaths = {
    tick: path.join(__dirname, '..', 'UI', 'musicimages', 'tick.gif'),
    wrong: path.join(__dirname, '..', 'UI', 'musicimages', 'wrong.gif'),
    itachi: path.join(__dirname, '..', 'UI', 'musicimages', 'itachi-sharingan.gif')
};

/**
 * Create attachments for status icons
 * @param {Array} iconTypes - Array of icon types needed ['tick', 'wrong', 'itachi']
 * @returns {Array} Array of AttachmentBuilder objects
 */
function createStatusIconAttachments(iconTypes = []) {
    const attachments = [];
    
    iconTypes.forEach(type => {
        if (statusIconPaths[type]) {
            attachments.push(new AttachmentBuilder(statusIconPaths[type], { 
                name: `${type}.gif` 
            }));
        }
    });
    
    return attachments;
}

/**
 * Replace emoji icons with attachment references
 * @param {string} text - Text containing emojis
 * @param {Object} options - Options for replacement
 * @returns {string} Text with emojis replaced
 */
function replaceEmojiWithAttachment(text, options = {}) {
    let replacedText = text;
    
    // Replace green checkmark
    if (options.useTick) {
        replacedText = replacedText.replace(/✅/g, '<:tick:attachment://tick.gif>');
    }
    
    // Replace red X
    if (options.useWrong) {
        replacedText = replacedText.replace(/❌/g, '<:wrong:attachment://wrong.gif>');
    }
    
    return replacedText;
}

/**
 * Get status icon URLs for embeds
 */
function getStatusIconUrls() {
    return {
        tick: 'attachment://tick.gif',
        wrong: 'attachment://wrong.gif',
        itachi: 'attachment://itachi-sharingan.gif'
    };
}

module.exports = {
    statusIconPaths,
    createStatusIconAttachments,
    replaceEmojiWithAttachment,
    getStatusIconUrls
};