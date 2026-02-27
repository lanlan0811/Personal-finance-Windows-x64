const DB_NAME = 'AccountingAssistantDB';
const DB_VERSION = 1;

let db = null;

const defaultCategories = {
  expense: [
    { id: 'expense-1', name: '餐饮', icon: 'utensils', color: '#8b5cf6', type: 'expense', subcategories: ['早餐', '午餐', '晚餐', '零食', '饮料'] },
    { id: 'expense-2', name: '住房', icon: 'home', color: '#10b981', type: 'expense', subcategories: ['房租', '水电', '物业费', '维修'] },
    { id: 'expense-3', name: '交通', icon: 'car', color: '#f59e0b', type: 'expense', subcategories: ['地铁', '公交', '打车', '加油', '停车'] },
    { id: 'expense-4', name: '购物', icon: 'shopping-bag', color: '#ef4444', type: 'expense', subcategories: ['衣服', '日用品', '数码', '化妆品'] },
    { id: 'expense-5', name: '娱乐', icon: 'gamepad-2', color: '#667eea', type: 'expense', subcategories: ['电影', '游戏', '会员', '旅游'] },
    { id: 'expense-6', name: '医疗', icon: 'heart-pulse', color: '#ec4899', type: 'expense', subcategories: ['药品', '挂号', '检查', '治疗'] },
    { id: 'expense-7', name: '教育', icon: 'book-open', color: '#06b6d4', type: 'expense', subcategories: ['培训', '书籍', '课程', '考试'] },
    { id: 'expense-8', name: '其他支出', icon: 'more-horizontal', color: '#6b7280', type: 'expense', subcategories: ['其他'] }
  ],
  income: [
    { id: 'income-1', name: '工资', icon: 'wallet', color: '#10b981', type: 'income', subcategories: ['基本工资', '加班费', '奖金'] },
    { id: 'income-2', name: '奖金', icon: 'trophy', color: '#f59e0b', type: 'income', subcategories: ['项目奖金', '年终奖', '绩效奖'] },
    { id: 'income-3', name: '投资收益', icon: 'trending-up', color: '#8b5cf6', type: 'income', subcategories: ['股票', '基金', '利息', '分红'] },
    { id: 'income-4', name: '兼职', icon: 'briefcase', color: '#06b6d4', type: 'income', subcategories: ['兼职收入', '自由职业'] },
    { id: 'income-5', name: '其他收入', icon: 'plus-circle', color: '#6b7280', type: 'income', subcategories: ['其他'] }
  ]
};

const defaultSettings = {
  user: {
    name: '用户',
    avatar: null,
    currency: 'CNY'
  },
  budget: {
    monthly: 20000,
    enabled: true
  },
  savingsGoal: {
    monthly: 10000,
    enabled: true
  },
  notifications: {
    dailyReminder: {
      enabled: false,
      time: '20:00'
    },
    overspendAlert: true,
    weeklyReport: true
  },
  theme: 'dark',
  language: 'zh-CN'
};

function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('数据库打开失败:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('数据库打开成功');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains('bills')) {
        const billsStore = database.createObjectStore('bills', { keyPath: 'id' });
        billsStore.createIndex('date', 'date', { unique: false });
        billsStore.createIndex('type', 'type', { unique: false });
        billsStore.createIndex('categoryId', 'categoryId', { unique: false });
        billsStore.createIndex('month', 'month', { unique: false });
      }

      if (!database.objectStoreNames.contains('categories')) {
        const categoriesStore = database.createObjectStore('categories', { keyPath: 'id' });
        categoriesStore.createIndex('type', 'type', { unique: false });
        categoriesStore.createIndex('name', 'name', { unique: false });
      }

      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }

      console.log('数据库结构创建完成');
    };
  });
}

async function initDefaultData() {
  try {
    const existingCategories = await getAllCategories();
    if (existingCategories.length === 0) {
      const allCategories = [...defaultCategories.expense, ...defaultCategories.income];
      for (const category of allCategories) {
        await addCategory(category);
      }
      console.log('默认分类初始化完成');
    }

    const existingSettings = await getSetting('user');
    if (!existingSettings) {
      for (const [key, value] of Object.entries(defaultSettings)) {
        await saveSetting(key, value);
      }
      console.log('默认设置初始化完成');
    }
  } catch (error) {
    console.error('初始化默认数据失败:', error);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function addBill(bill) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills'], 'readwrite');
    const store = transaction.objectStore('bills');
    
    const billData = {
      id: bill.id || generateId(),
      type: bill.type,
      amount: parseFloat(bill.amount),
      categoryId: bill.categoryId,
      categoryName: bill.categoryName,
      subcategory: bill.subcategory || '',
      description: bill.description || '',
      date: bill.date || new Date().toISOString(),
      month: bill.date ? bill.date.substring(0, 7) : new Date().toISOString().substring(0, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const request = store.add(billData);
    
    request.onsuccess = () => resolve(billData);
    request.onerror = () => reject(request.error);
  });
}

async function updateBill(bill) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills'], 'readwrite');
    const store = transaction.objectStore('bills');
    
    const billData = {
      ...bill,
      month: bill.date ? bill.date.substring(0, 7) : bill.month,
      updatedAt: new Date().toISOString()
    };

    const request = store.put(billData);
    
    request.onsuccess = () => resolve(billData);
    request.onerror = () => reject(request.error);
  });
}

async function deleteBill(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills'], 'readwrite');
    const store = transaction.objectStore('bills');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function getBill(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills'], 'readonly');
    const store = transaction.objectStore('bills');
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllBills() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills'], 'readonly');
    const store = transaction.objectStore('bills');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getBillsByMonth(month) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills'], 'readonly');
    const store = transaction.objectStore('bills');
    const index = store.index('month');
    const request = index.getAll(month);
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getBillsByDateRange(startDate, endDate) {
  const allBills = await getAllBills();
  return allBills.filter(bill => {
    const billDate = new Date(bill.date);
    return billDate >= new Date(startDate) && billDate <= new Date(endDate);
  });
}

async function getBillsByType(type) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills'], 'readonly');
    const store = transaction.objectStore('bills');
    const index = store.index('type');
    const request = index.getAll(type);
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getBillsByCategory(categoryId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills'], 'readonly');
    const store = transaction.objectStore('bills');
    const index = store.index('categoryId');
    const request = index.getAll(categoryId);
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function addCategory(category) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    
    const categoryData = {
      id: category.id || generateId(),
      name: category.name,
      icon: category.icon || 'circle',
      color: category.color || '#6b7280',
      type: category.type,
      subcategories: category.subcategories || [],
      createdAt: new Date().toISOString()
    };

    const request = store.add(categoryData);
    
    request.onsuccess = () => resolve(categoryData);
    request.onerror = () => reject(request.error);
  });
}

async function updateCategory(category) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.put(category);
    
    request.onsuccess = () => resolve(category);
    request.onerror = () => reject(request.error);
  });
}

async function deleteCategory(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function getCategory(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllCategories() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getCategoriesByType(type) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const index = store.index('type');
    const request = index.getAll(type);
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function saveSetting(key, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put({ key, value, updatedAt: new Date().toISOString() });
    
    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
  });
}

async function getSetting(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result ? request.result.value : null);
    request.onerror = () => reject(request.error);
  });
}

async function getAllSettings() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const settings = {};
      (request.result || []).forEach(item => {
        settings[item.key] = item.value;
      });
      resolve(settings);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getMonthlyStats(month) {
  const bills = await getBillsByMonth(month);
  
  const stats = {
    income: 0,
    expense: 0,
    balance: 0,
    bills: bills,
    categoryStats: {}
  };

  bills.forEach(bill => {
    if (bill.type === 'income') {
      stats.income += bill.amount;
    } else {
      stats.expense += bill.amount;
      
      if (!stats.categoryStats[bill.categoryId]) {
        stats.categoryStats[bill.categoryId] = {
          categoryId: bill.categoryId,
          categoryName: bill.categoryName,
          amount: 0,
          count: 0
        };
      }
      stats.categoryStats[bill.categoryId].amount += bill.amount;
      stats.categoryStats[bill.categoryId].count++;
    }
  });

  stats.balance = stats.income - stats.expense;
  
  return stats;
}

async function getYearlyStats(year) {
  const allBills = await getAllBills();
  const yearBills = allBills.filter(bill => bill.date.startsWith(year));
  
  const monthlyData = {};
  for (let i = 1; i <= 12; i++) {
    const month = `${year}-${i.toString().padStart(2, '0')}`;
    monthlyData[month] = { income: 0, expense: 0 };
  }

  yearBills.forEach(bill => {
    const month = bill.month;
    if (bill.type === 'income') {
      monthlyData[month].income += bill.amount;
    } else {
      monthlyData[month].expense += bill.amount;
    }
  });

  return monthlyData;
}

async function exportData() {
  const bills = await getAllBills();
  const categories = await getAllCategories();
  const settings = await getAllSettings();
  
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {
      bills,
      categories,
      settings
    }
  };
}

async function importData(data) {
  if (!data || !data.data) {
    throw new Error('无效的备份数据格式');
  }

  const { bills, categories, settings } = data.data;

  if (bills && Array.isArray(bills)) {
    for (const bill of bills) {
      await addBill(bill);
    }
  }

  if (categories && Array.isArray(categories)) {
    for (const category of categories) {
      try {
        await addCategory(category);
      } catch (e) {
        await updateCategory(category);
      }
    }
  }

  if (settings) {
    for (const [key, value] of Object.entries(settings)) {
      await saveSetting(key, value);
    }
  }

  return true;
}

async function clearAllData() {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills', 'categories', 'settings'], 'readwrite');
    
    transaction.objectStore('bills').clear();
    transaction.objectStore('categories').clear();
    transaction.objectStore('settings').clear();
    
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function initDatabase() {
  await initDB();
  await initDefaultData();
  console.log('数据库初始化完成');
}

window.db = {
  init: initDatabase,
  addBill,
  updateBill,
  deleteBill,
  getBill,
  getAllBills,
  getBillsByMonth,
  getBillsByDateRange,
  getBillsByType,
  getBillsByCategory,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategories,
  getCategoriesByType,
  saveSetting,
  getSetting,
  getAllSettings,
  getMonthlyStats,
  getYearlyStats,
  exportData,
  importData,
  clearAllData,
  generateId
};
