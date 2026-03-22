const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  
  aiChat: (params) => ipcRenderer.invoke('ai-chat', params),
  
  showNotification: (title, body) => 
    ipcRenderer.send('show-notification', { title, body }),
  
  scheduleReminder: (time) => 
    ipcRenderer.send('schedule-reminder', time),
  
  cancelReminder: () => 
    ipcRenderer.send('cancel-reminder'),
  
  onReminder: (callback) => 
    ipcRenderer.on('reminder-triggered', callback),
  
  enableWeeklyReport: (enabled) => 
    ipcRenderer.send('enable-weekly-report', enabled),
  
  onGenerateWeeklyReport: (callback) => 
    ipcRenderer.on('generate-weekly-report', callback),
  
  showWeeklyReport: (report) => 
    ipcRenderer.send('show-weekly-report', report),
  
  platform: process.platform,
  
  appVersion: process.env.npm_package_version || '2.0.0',
  
  onConfigLoaded: (callback) => 
    ipcRenderer.on('config-loaded', callback)
});

contextBridge.exposeInMainWorld('dbAPI', {
  init: () => ipcRenderer.invoke('db-init'),
  addBill: (bill) => ipcRenderer.invoke('db-add-bill', bill),
  updateBill: (bill) => ipcRenderer.invoke('db-update-bill', bill),
  deleteBill: (id) => ipcRenderer.invoke('db-delete-bill', id),
  getBill: (id) => ipcRenderer.invoke('db-get-bill', id),
  getAllBills: () => ipcRenderer.invoke('db-get-all-bills'),
  getBillsByMonth: (month) => ipcRenderer.invoke('db-get-bills-by-month', month),
  getBillsByDateRange: (start, end) => ipcRenderer.invoke('db-get-bills-by-date-range', { start, end }),
  getBillsByType: (type) => ipcRenderer.invoke('db-get-bills-by-type', type),
  getBillsByCategory: (categoryId) => ipcRenderer.invoke('db-get-bills-by-category', categoryId),
  
  addCategory: (category) => ipcRenderer.invoke('db-add-category', category),
  updateCategory: (category) => ipcRenderer.invoke('db-update-category', category),
  deleteCategory: (id) => ipcRenderer.invoke('db-delete-category', id),
  getCategory: (id) => ipcRenderer.invoke('db-get-category', id),
  getAllCategories: () => ipcRenderer.invoke('db-get-all-categories'),
  getCategoriesByType: (type) => ipcRenderer.invoke('db-get-categories-by-type', type),
  
  saveSetting: (key, value) => ipcRenderer.invoke('db-save-setting', { key, value }),
  getSetting: (key) => ipcRenderer.invoke('db-get-setting', key),
  getAllSettings: () => ipcRenderer.invoke('db-get-all-settings'),
  
  getMonthlyStats: (month) => ipcRenderer.invoke('db-get-monthly-stats', month),
  getYearlyStats: (year) => ipcRenderer.invoke('db-get-yearly-stats', year),
  
  exportData: () => ipcRenderer.invoke('db-export-data'),
  importData: (data) => ipcRenderer.invoke('db-import-data', data),
  clearAllData: () => ipcRenderer.invoke('db-clear-all-data'),
  
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2)
});
