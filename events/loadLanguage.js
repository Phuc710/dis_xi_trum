const fs = require('fs');
const path = require('path');
const config = require('../config.js');

const langPath = path.join(__dirname, '../languages', `${config.language}.js`);
let lang;

try {
  lang = require(langPath);
} catch (err) {
  console.error(`Language file for ${config.language} not found.`, err);
  process.exit(1);
}

module.exports = lang;

