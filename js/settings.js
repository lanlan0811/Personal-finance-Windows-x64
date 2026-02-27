const settingsModule = {
  settings: null,
  
  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.render();
    this.setupWeeklyReportListener();
    this.restoreNotificationTimers();
  },

  restoreNotificationTimers() {
    const notifications = this.settings?.notifications || {};
    
    if (notifications.dailyReminder?.enabled && window.electronAPI?.scheduleReminder) {
      window.electronAPI.scheduleReminder(notifications.dailyReminder.time);
    }
    
    if (notifications.weeklyReport && window.electronAPI?.enableWeeklyReport) {
      window.electronAPI.enableWeeklyReport(true);
    }
  },

  async loadSettings() {
    this.settings = await window.db.getAllSettings();
  },

  bindEvents() {
    document.querySelectorAll('.settings-nav-item').forEach(item => {
      item.addEventListener('click', () => this.switchSection(item.dataset.setting));
    });

    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => this.saveProfile());
    }

    const saveBudgetBtn = document.getElementById('save-budget-btn');
    if (saveBudgetBtn) {
      saveBudgetBtn.addEventListener('click', () => this.saveBudget());
    }

    const saveNotificationsBtn = document.getElementById('save-notifications-btn');
    if (saveNotificationsBtn) {
      saveNotificationsBtn.addEventListener('click', () => this.saveNotifications());
    }

    const saveThemeBtn = document.getElementById('save-theme-btn');
    if (saveThemeBtn) {
      saveThemeBtn.addEventListener('click', () => this.saveTheme());
    }

    const editAvatarBtn = document.getElementById('edit-avatar-btn');
    const avatarInput = document.getElementById('avatar-input');
    if (editAvatarBtn && avatarInput) {
      editAvatarBtn.addEventListener('click', () => avatarInput.click());
      avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
    }

    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        themeOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
      });
    });

    const budgetEnabledToggle = document.getElementById('budget-enabled-toggle');
    if (budgetEnabledToggle) {
      budgetEnabledToggle.addEventListener('click', () => {
        budgetEnabledToggle.classList.toggle('active');
      });
    }

    const overspendAlertToggle = document.getElementById('overspend-alert-toggle');
    if (overspendAlertToggle) {
      overspendAlertToggle.addEventListener('click', () => {
        overspendAlertToggle.classList.toggle('active');
      });
    }

    const dailyReminderToggle = document.getElementById('daily-reminder-toggle');
    if (dailyReminderToggle) {
      dailyReminderToggle.addEventListener('click', () => {
        dailyReminderToggle.classList.toggle('active');
        this.toggleReminderTime();
      });
    }

    const weeklyReportToggle = document.getElementById('weekly-report-toggle');
    if (weeklyReportToggle) {
      weeklyReportToggle.addEventListener('click', () => {
        weeklyReportToggle.classList.toggle('active');
      });
    }

    const notificationOverspendToggle = document.getElementById('notification-overspend-toggle');
    if (notificationOverspendToggle) {
      notificationOverspendToggle.addEventListener('click', () => {
        notificationOverspendToggle.classList.toggle('active');
      });
    }

    const followSystemToggle = document.getElementById('follow-system-toggle');
    if (followSystemToggle) {
      followSystemToggle.addEventListener('click', () => {
        followSystemToggle.classList.toggle('active');
        this.toggleFollowSystem();
      });
    }

    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    const importBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-file-input');
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', (e) => this.importData(e));
    }

    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllData());
    }
  },

  switchSection(sectionId) {
    document.querySelectorAll('.settings-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.setting === sectionId);
    });

    document.querySelectorAll('.settings-section').forEach(section => {
      section.classList.toggle('hidden', section.id !== `setting-${sectionId}`);
    });
  },

  toggleReminderTime() {
    const toggle = document.getElementById('daily-reminder-toggle');
    const timeGroup = document.getElementById('reminder-time-group');
    if (timeGroup) {
      timeGroup.style.opacity = toggle?.classList.contains('active') ? '1' : '0.5';
    }
  },

  toggleFollowSystem() {
    const toggle = document.getElementById('follow-system-toggle');
    const themeOptions = document.querySelectorAll('.theme-option');
    const isActive = toggle?.classList.contains('active');
    
    themeOptions.forEach(option => {
      option.style.pointerEvents = isActive ? 'none' : 'auto';
      option.style.opacity = isActive ? '0.5' : '1';
    });

    if (isActive) {
      this.applySystemTheme();
    }
  },

  applySystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    this.applyTheme(theme);
  },

  render() {
    this.renderProfile();
    this.renderBudget();
    this.renderNotifications();
    this.renderTheme();
    this.renderDataSection();
  },

  renderProfile() {
    const user = this.settings.user || {};
    const savingsGoal = this.settings.savingsGoal || {};

    const nameInput = document.getElementById('user-name');
    const currencySelect = document.getElementById('user-currency');
    const savingsInput = document.getElementById('savings-goal');
    const displayName = document.getElementById('display-user-name');
    const avatarInitial = document.getElementById('avatar-initial');
    const usageDays = document.getElementById('usage-days');
    const userAvatar = document.getElementById('user-avatar');

    if (nameInput) nameInput.value = user.name || '用户';
    if (currencySelect) currencySelect.value = user.currency || 'CNY';
    if (savingsInput) savingsInput.value = savingsGoal.monthly || '';

    if (displayName) displayName.textContent = user.name || '用户';
    if (avatarInitial) avatarInitial.textContent = (user.name || '用').charAt(0);
    
    if (user.avatar && userAvatar) {
      const existingImg = userAvatar.querySelector('img');
      if (existingImg) {
        existingImg.src = user.avatar;
      } else {
        const img = document.createElement('img');
        img.src = user.avatar;
        img.alt = '用户头像';
        userAvatar.insertBefore(img, userAvatar.firstChild);
      }
    }

    if (usageDays) {
      const createdAt = user.createdAt || new Date().toISOString();
      const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
      usageDays.textContent = days;
    }
  },

  renderBudget() {
    const budget = this.settings.budget || {};

    const budgetInput = document.getElementById('monthly-budget');
    const budgetToggle = document.getElementById('budget-enabled-toggle');
    const overspendToggle = document.getElementById('overspend-alert-toggle');
    const thresholdInput = document.getElementById('budget-warning-threshold');

    if (budgetInput) budgetInput.value = budget.monthly || '';
    if (budgetToggle && budget.enabled) budgetToggle.classList.add('active');
    if (overspendToggle && budget.overspendAlert) overspendToggle.classList.add('active');
    if (thresholdInput) thresholdInput.value = budget.warningThreshold || 80;
  },

  renderNotifications() {
    const notifications = this.settings.notifications || {};

    const dailyToggle = document.getElementById('daily-reminder-toggle');
    const weeklyToggle = document.getElementById('weekly-report-toggle');
    const overspendToggle = document.getElementById('notification-overspend-toggle');
    const timeInput = document.getElementById('reminder-time');

    if (dailyToggle && notifications.dailyReminder?.enabled) {
      dailyToggle.classList.add('active');
    }
    if (weeklyToggle && notifications.weeklyReport) {
      weeklyToggle.classList.add('active');
    }
    if (overspendToggle && notifications.overspendAlert) {
      overspendToggle.classList.add('active');
    }
    if (timeInput) {
      timeInput.value = notifications.dailyReminder?.time || '20:00';
    }

    this.toggleReminderTime();
  },

  renderTheme() {
    const themeSettings = this.settings.theme || {};
    const theme = themeSettings.current || 'dark';
    const followSystem = themeSettings.followSystem || false;

    const themeOptions = document.querySelectorAll('.theme-option');
    const followSystemToggle = document.getElementById('follow-system-toggle');

    themeOptions.forEach(option => {
      option.classList.toggle('active', option.dataset.theme === theme);
    });

    if (followSystemToggle && followSystem) {
      followSystemToggle.classList.add('active');
      this.toggleFollowSystem();
    }

    this.applyTheme(theme);
  },

  renderDataSection() {
  },

  async handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.showToast('请选择图片文件', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      window.showToast('图片大小不能超过2MB', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const avatarData = e.target.result;
        
        const user = { ...this.settings.user, avatar: avatarData };
        await window.db.saveSetting('user', user);
        this.settings.user = user;

        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
          const existingImg = userAvatar.querySelector('img');
          if (existingImg) {
            existingImg.src = avatarData;
          } else {
            const img = document.createElement('img');
            img.src = avatarData;
            img.alt = '用户头像';
            userAvatar.insertBefore(img, userAvatar.firstChild);
          }
        }

        window.showToast('头像已更新', 'success');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('上传头像失败:', error);
      window.showToast('上传头像失败', 'error');
    }
  },

  async saveProfile() {
    const name = document.getElementById('user-name')?.value?.trim() || '用户';
    const currency = document.getElementById('user-currency')?.value || 'CNY';
    const savingsGoalValue = parseFloat(document.getElementById('savings-goal')?.value) || 0;

    if (!name) {
      window.showToast('请输入用户名', 'error');
      return;
    }

    const user = { 
      ...this.settings.user, 
      name, 
      currency,
      createdAt: this.settings.user?.createdAt || new Date().toISOString()
    };
    const savings = { monthly: savingsGoalValue, enabled: savingsGoalValue > 0 };

    await window.db.saveSetting('user', user);
    await window.db.saveSetting('savingsGoal', savings);

    this.settings.user = user;
    this.settings.savingsGoal = savings;

    const displayName = document.getElementById('display-user-name');
    const avatarInitial = document.getElementById('avatar-initial');
    if (displayName) displayName.textContent = name;
    if (avatarInitial) avatarInitial.textContent = name.charAt(0);

    window.showToast('个人信息已保存', 'success');

    if (window.homeModule) {
      window.homeModule.refresh();
    }
  },

  async saveBudget() {
    const monthly = parseFloat(document.getElementById('monthly-budget')?.value) || 0;
    const enabled = document.getElementById('budget-enabled-toggle')?.classList.contains('active') || false;
    const overspendAlert = document.getElementById('overspend-alert-toggle')?.classList.contains('active') || false;
    const warningThreshold = parseInt(document.getElementById('budget-warning-threshold')?.value) || 80;

    if (monthly <= 0 && enabled) {
      window.showToast('请输入有效的预算金额', 'error');
      return;
    }

    const budget = { 
      monthly, 
      enabled, 
      overspendAlert,
      warningThreshold
    };

    await window.db.saveSetting('budget', budget);
    this.settings.budget = budget;

    window.showToast('预算设置已保存', 'success');

    if (window.categoryModule) {
      window.categoryModule.refresh();
    }

    if (overspendAlert && window.electronAPI?.scheduleReminder) {
      this.checkBudgetOverspend();
    }
  },

  async checkBudgetOverspend() {
    const budget = this.settings.budget;
    if (!budget?.enabled || !budget?.overspendAlert) return;

    const bills = await window.db.getAllBills();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = bills
      .filter(bill => {
        const billDate = new Date(bill.date);
        return bill.type === 'expense' && 
               billDate.getMonth() === currentMonth && 
               billDate.getFullYear() === currentYear;
      })
      .reduce((sum, bill) => sum + bill.amount, 0);

    const usagePercent = (monthlyExpenses / budget.monthly) * 100;

    if (usagePercent >= budget.warningThreshold) {
      const isOverspend = monthlyExpenses > budget.monthly;
      const title = isOverspend ? '预算超支警告' : '预算使用提醒';
      const body = isOverspend 
        ? `您本月支出已超过预算！当前支出：¥${monthlyExpenses.toFixed(2)}，预算：¥${budget.monthly.toFixed(2)}`
        : `您本月预算已使用${usagePercent.toFixed(1)}%，请注意控制支出。`;

      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification(title, body);
      }
    }
  },

  async saveNotifications() {
    const dailyReminderEnabled = document.getElementById('daily-reminder-toggle')?.classList.contains('active') || false;
    const reminderTime = document.getElementById('reminder-time')?.value || '20:00';
    const weeklyReport = document.getElementById('weekly-report-toggle')?.classList.contains('active') || false;
    const overspendAlert = document.getElementById('notification-overspend-toggle')?.classList.contains('active') || false;

    const notifications = {
      dailyReminder: {
        enabled: dailyReminderEnabled,
        time: reminderTime
      },
      weeklyReport,
      overspendAlert
    };

    await window.db.saveSetting('notifications', notifications);
    this.settings.notifications = notifications;

    if (window.electronAPI) {
      if (dailyReminderEnabled && window.electronAPI.scheduleReminder) {
        window.electronAPI.scheduleReminder(reminderTime);
      } else if (window.electronAPI.cancelReminder) {
        window.electronAPI.cancelReminder();
      }

      if (window.electronAPI.enableWeeklyReport) {
        window.electronAPI.enableWeeklyReport(weeklyReport);
      }
    }

    window.showToast('通知设置已保存', 'success');
  },

  async generateWeeklyReport() {
    const bills = await window.db.getAllBills();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyBills = bills.filter(bill => {
      const billDate = new Date(bill.date);
      return billDate >= weekAgo && billDate <= now;
    });

    const income = weeklyBills
      .filter(bill => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0);
    
    const expense = weeklyBills
      .filter(bill => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0);
    
    const balance = income - expense;

    const categoryStats = {};
    weeklyBills
      .filter(bill => bill.type === 'expense')
      .forEach(bill => {
        if (!categoryStats[bill.categoryName]) {
          categoryStats[bill.categoryName] = 0;
        }
        categoryStats[bill.categoryName] += bill.amount;
      });

    const report = {
      income,
      expense,
      balance,
      categoryStats,
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      billCount: weeklyBills.length
    };

    if (window.electronAPI?.showWeeklyReport) {
      window.electronAPI.showWeeklyReport(report);
    }

    return report;
  },

  setupWeeklyReportListener() {
    if (window.electronAPI?.onGenerateWeeklyReport) {
      window.electronAPI.onGenerateWeeklyReport(() => {
        this.generateWeeklyReport();
      });
    }
  },

  async saveTheme() {
    const activeOption = document.querySelector('.theme-option.active');
    const theme = activeOption?.dataset.theme || 'dark';
    const followSystem = document.getElementById('follow-system-toggle')?.classList.contains('active') || false;

    const themeSettings = {
      current: theme,
      followSystem
    };

    await window.db.saveSetting('theme', themeSettings);
    this.settings.theme = themeSettings;

    this.applyTheme(theme);

    window.showToast('主题设置已保存', 'success');
  },

  applyTheme(theme) {
    document.body.classList.remove('light-theme', 'purple-theme', 'dark-theme');
    
    switch (theme) {
      case 'light':
        document.body.classList.add('light-theme');
        break;
      case 'purple':
        document.body.classList.add('purple-theme');
        break;
      default:
        document.body.classList.add('dark-theme');
    }
  },

  async changeTheme(theme) {
    const themeSettings = {
      current: theme,
      followSystem: false
    };

    await window.db.saveSetting('theme', themeSettings);
    this.settings.theme = themeSettings;

    this.applyTheme(theme);

    window.showToast('主题已切换', 'success');
  },

  async exportData() {
    try {
      const data = await window.db.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `记账助手备份_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.showToast('数据导出成功', 'success');
    } catch (error) {
      console.error('导出数据失败:', error);
      window.showToast('导出数据失败', 'error');
    }
  },

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      window.showConfirmModal('导入数据', '导入将覆盖现有数据，确定要继续吗？', async () => {
        try {
          await window.db.clearAllData();
          await window.db.importData(data);
          
          window.showToast('数据导入成功', 'success');
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.error('导入数据失败:', error);
          window.showToast('导入数据失败', 'error');
        }
      });
    } catch (error) {
      console.error('解析文件失败:', error);
      window.showToast('文件格式错误', 'error');
    }

    event.target.value = '';
  },

  async clearAllData() {
    window.showConfirmModal('清除数据', '确定要清除所有数据吗？此操作不可撤销！', async () => {
      try {
        await window.db.clearAllData();
        window.showToast('数据已清除', 'success');
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('清除数据失败:', error);
        window.showToast('清除数据失败', 'error');
      }
    });
  },

  async refresh() {
    await this.loadSettings();
    this.render();
  }
};

window.settingsModule = settingsModule;
