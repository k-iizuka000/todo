const fs = require('fs');
const path = require('path');

// .envファイルを読み込む
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/API_KEY=(.+)/);

if (!apiKeyMatch) {
    console.error('.envファイルにAPI_KEYが見つかりません');
    process.exit(1);
}

const apiKey = apiKeyMatch[1];

// HTMLファイルを読み込む
const htmlPath = path.join(__dirname, 'gemini-todo.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// APIキーを置換
htmlContent = htmlContent.replace(/const API_KEY = '%%API_KEY%%';/, `const API_KEY = '${apiKey}';`);

// HTMLファイルを更新
fs.writeFileSync(htmlPath, htmlContent);

console.log('APIキーを正常に更新しました'); 