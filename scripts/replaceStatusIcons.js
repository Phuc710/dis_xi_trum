const fs = require('fs');
const path = require('path');

/**
 * Script to replace ✅ and ❌ emojis with local GIF attachments
 * This script will scan all JavaScript files and suggest replacements
 */

const projectRoot = path.join(__dirname, '..');
const statusIconsPath = path.join(projectRoot, 'utils', 'statusIcons.js');

// Files to ignore
const ignoreFiles = [
    'node_modules',
    '.git',
    'scripts',
    'package-lock.json',
    'package.json'
];

// Patterns to find
const patterns = {
    greenTick: /✅/g,
    redX: /❌/g,
    successContent: /(content:\s*['"`])(✅[^'"`]*['"`])/g,
    errorContent: /(content:\s*['"`])(❌[^'"`]*['"`])/g,
    buttonLabel: /(\.setLabel\(['"`])(✅|❌)([^'"`]*['"`]\))/g
};

// Replacement suggestions
const suggestions = {
    forButtons: `
// For buttons, remove emojis from labels and add icons as attachments:
const { createStatusIconAttachments } = require('../utils/statusIcons');
const statusIcons = createStatusIconAttachments(['tick', 'wrong']);

// Then in your button:
new ButtonBuilder().setCustomId('accept').setLabel('Accept').setStyle(ButtonStyle.Success)

// And add files to your message:
await channel.send({ embeds: [embed], components: [row], files: statusIcons });
`,
    
    forMessages: `
// For simple messages, you can still use emojis or create attachments:
// Option 1: Keep emojis (simplest)
await interaction.reply({ content: '✅ Success!' });

// Option 2: Use attachments (more consistent with music interface)
const statusIcons = createStatusIconAttachments(['tick']);
await interaction.reply({ content: 'Success!', files: statusIcons });
`
};

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const findings = [];
        
        // Check for emoji usage
        if (patterns.greenTick.test(content)) {
            findings.push({
                type: 'Green Tick (✅)',
                count: content.match(patterns.greenTick).length
            });
        }
        
        if (patterns.redX.test(content)) {
            findings.push({
                type: 'Red X (❌)',
                count: content.match(patterns.redX).length
            });
        }
        
        return findings;
    } catch (error) {
        return [];
    }
}

function scanDirectory(dir, results = {}) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (ignoreFiles.some(ignore => fullPath.includes(ignore))) {
            continue;
        }
        
        if (stat.isDirectory()) {
            scanDirectory(fullPath, results);
        } else if (file.endsWith('.js')) {
            const findings = scanFile(fullPath);
            if (findings.length > 0) {
                results[fullPath] = findings;
            }
        }
    }
    
    return results;
}

// Main execution
console.log('🔍 Scanning for status icons in Discord bot...\n');

const results = scanDirectory(projectRoot);
const totalFiles = Object.keys(results).length;

if (totalFiles === 0) {
    console.log('✨ No status icons found to replace!');
} else {
    console.log(`📋 Found status icons in ${totalFiles} files:\n`);
    
    Object.entries(results).forEach(([filePath, findings]) => {
        const relativePath = path.relative(projectRoot, filePath);
        console.log(`📁 ${relativePath}`);
        findings.forEach(finding => {
            console.log(`   ${finding.type}: ${finding.count} occurrence(s)`);
        });
        console.log();
    });
    
    console.log('💡 Replacement Suggestions:');
    console.log(suggestions.forButtons);
    console.log(suggestions.forMessages);
    
    console.log('\n🚀 What has been implemented:');
    console.log('✅ Music interface now uses itachi-sharingan.gif for "Now Playing" icon');
    console.log('✅ Status icon utility created at utils/statusIcons.js');
    console.log('✅ Applications handler updated to use local GIF attachments');
    
    console.log('\n📝 To complete the migration:');
    console.log('1. Import the statusIcons utility in files that need it');
    console.log('2. Replace emoji usage with attachment references');
    console.log('3. Add status icon attachments to Discord messages');
    console.log('4. Test the bot to ensure icons display properly');
}

module.exports = { scanDirectory, patterns };