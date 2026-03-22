const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const config = {
  ai: {
    apiUrl: process.env.AI_API_URL || 'https://api-inference.modelscope.cn/v1/chat/completions',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'ZhipuAI/GLM-4.7-Flash',
    maxTokens: 200,
    temperature: 0.7
  },
  app: {
    name: '记账助手',
    version: '2.0.0'
  },
  notifications: {
    dailyReminder: {
      enabled: false,
      time: '20:00'
    },
    overspendAlert: true,
    weeklyReport: true
  }
};

module.exports = config;
