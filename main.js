const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Notification, ipcMain, nativeImage } = require('electron');
const config = require('./config');

let mainWindow = null;
let reminderTimeout = null;

function getNotificationIcon() {
  const pngIconPath = path.join(__dirname, 'assets/icons/logo.png');
  const svgIconPath = path.join(__dirname, 'assets/icons/logo.svg');
  
  if (fs.existsSync(pngIconPath)) {
    try {
      return nativeImage.createFromPath(pngIconPath);
    } catch (e) {
      console.warn('无法加载PNG通知图标:', e);
    }
  }
  
  if (fs.existsSync(svgIconPath)) {
    try {
      return nativeImage.createFromPath(svgIconPath);
    } catch (e) {
      console.warn('无法加载SVG通知图标:', e);
    }
  }
  
  return null;
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: true,
    transparent: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      sandbox: false
    }
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      window.appConfig = ${JSON.stringify(config)};
    `).catch(err => console.error('注入配置失败:', err));
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('config-loaded', config);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('ai-chat', async (event, { apiUrl, apiKey, model, messages, maxTokens, temperature }) => {
  const https = require('https');
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const requestBody = JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      enable_thinking: false
    });
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data));
        }
      });
    });
    
    req.on('error', (e) => reject(e));
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(requestBody);
    req.end();
  });
});

ipcMain.on('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    const icon = getNotificationIcon();
    const notificationOptions = {
      title: title || '记账助手',
      body: body || ''
    };
    if (icon && !icon.isEmpty()) {
      notificationOptions.icon = icon;
    }
    const notification = new Notification(notificationOptions);
    notification.show();
    
    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }
});

ipcMain.on('schedule-reminder', (event, time) => {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
  
  if (!time) return;
  
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);
  
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  const delay = reminderTime - now;
  
  reminderTimeout = setTimeout(() => {
    if (Notification.isSupported()) {
      const icon = getNotificationIcon();
      const notificationOptions = {
        title: '记账提醒',
        body: '别忘了记录今天的收支哦！'
      };
      if (icon && !icon.isEmpty()) {
        notificationOptions.icon = icon;
      }
      const notification = new Notification(notificationOptions);
      notification.show();
      
      notification.on('click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
    }
    
    if (mainWindow) {
      mainWindow.webContents.send('reminder-triggered', { time });
    }
    
    scheduleNextReminder(time);
  }, delay);
});

function scheduleNextReminder(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const nextTime = new Date();
  nextTime.setHours(hours, minutes, 0, 0);
  nextTime.setDate(nextTime.getDate() + 1);
  
  const delay = nextTime - now;
  
  reminderTimeout = setTimeout(() => {
    if (Notification.isSupported()) {
      const icon = getNotificationIcon();
      const notificationOptions = {
        title: '记账提醒',
        body: '别忘了记录今天的收支哦！'
      };
      if (icon && !icon.isEmpty()) {
        notificationOptions.icon = icon;
      }
      const notification = new Notification(notificationOptions);
      notification.show();
    }
    
    if (mainWindow) {
      mainWindow.webContents.send('reminder-triggered', { time });
    }
    
    scheduleNextReminder(time);
  }, delay);
}

ipcMain.on('cancel-reminder', () => {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
});

let weeklyReportInterval = null;

ipcMain.on('enable-weekly-report', (event, enabled) => {
  if (weeklyReportInterval) {
    clearInterval(weeklyReportInterval);
    weeklyReportInterval = null;
  }
  
  if (enabled) {
    scheduleWeeklyReport();
  }
});

function scheduleWeeklyReport() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(20, 0, 0, 0);
  
  if (daysUntilSunday === 0 && now.getHours() >= 20) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }
  
  const delay = nextSunday - now;
  
  setTimeout(() => {
    sendWeeklyReport();
    
    weeklyReportInterval = setInterval(() => {
      sendWeeklyReport();
    }, 7 * 24 * 60 * 60 * 1000);
  }, delay);
}

function sendWeeklyReport() {
  if (mainWindow && Notification.isSupported()) {
    mainWindow.webContents.send('generate-weekly-report');
  }
}

ipcMain.on('show-weekly-report', (event, report) => {
  if (Notification.isSupported()) {
    const icon = getNotificationIcon();
    const notificationOptions = {
      title: '本周财务周报',
      body: `本周收入：¥${report.income.toFixed(2)}，支出：¥${report.expense.toFixed(2)}，结余：¥${report.balance.toFixed(2)}`
    };
    if (icon && !icon.isEmpty()) {
      notificationOptions.icon = icon;
    }
    const notification = new Notification(notificationOptions);
    notification.show();
    
    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }
});

ipcMain.handle('db-init', async () => {
  return true;
});

ipcMain.handle('db-add-bill', async (event, bill) => {
  return bill;
});

ipcMain.handle('db-update-bill', async (event, bill) => {
  return bill;
});

ipcMain.handle('db-delete-bill', async (event, id) => {
  return true;
});

ipcMain.handle('db-get-bill', async (event, id) => {
  return null;
});

ipcMain.handle('db-get-all-bills', async () => {
  return [];
});

ipcMain.handle('db-get-bills-by-month', async (event, month) => {
  return [];
});

ipcMain.handle('db-get-bills-by-date-range', async (event, { start, end }) => {
  return [];
});

ipcMain.handle('db-get-bills-by-type', async (event, type) => {
  return [];
});

ipcMain.handle('db-get-bills-by-category', async (event, categoryId) => {
  return [];
});

ipcMain.handle('db-add-category', async (event, category) => {
  return category;
});

ipcMain.handle('db-update-category', async (event, category) => {
  return category;
});

ipcMain.handle('db-delete-category', async (event, id) => {
  return true;
});

ipcMain.handle('db-get-category', async (event, id) => {
  return null;
});

ipcMain.handle('db-get-all-categories', async () => {
  return [];
});

ipcMain.handle('db-get-categories-by-type', async (event, type) => {
  return [];
});

ipcMain.handle('db-save-setting', async (event, { key, value }) => {
  return value;
});

ipcMain.handle('db-get-setting', async (event, key) => {
  return null;
});

ipcMain.handle('db-get-all-settings', async () => {
  return {};
});

ipcMain.handle('db-get-monthly-stats', async (event, month) => {
  return { income: 0, expense: 0, balance: 0, bills: [], categoryStats: {} };
});

ipcMain.handle('db-get-yearly-stats', async (event, year) => {
  return {};
});

ipcMain.handle('db-export-data', async () => {
  return { version: '1.0', exportDate: new Date().toISOString(), data: { bills: [], categories: [], settings: {} } };
});

ipcMain.handle('db-import-data', async (event, data) => {
  return true;
});

ipcMain.handle('db-clear-all-data', async () => {
  return true;
});
