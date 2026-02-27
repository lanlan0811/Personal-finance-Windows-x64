document.addEventListener('DOMContentLoaded', async function() {
  await initDatabase();
  await waitForConfig();
  initLucideIcons();
  updateCurrentDate();
  initNavigation();
  initSettingsNavigation();
  initToggles();
  await initModules();
  initSearch();
  initNetworkStatus();
});

async function waitForConfig() {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (!window.appConfig && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.appConfig) {
    window.appConfig = { ai: { apiKey: '' } };
  }
}

async function initDatabase() {
  if (window.db) {
    await window.db.init();
  }
}

function initLucideIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updateCurrentDate() {
  const dateElement = document.getElementById('current-date');
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  dateElement.textContent = now.toLocaleDateString('zh-CN', options);
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const pageId = this.getAttribute('data-page');

      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      pages.forEach(page => {
        page.classList.add('hidden');
      });

      const targetPage = document.getElementById('page-' + pageId);
      if (targetPage) {
        targetPage.classList.remove('hidden');
      }
    });
  });
}

function initSettingsNavigation() {
  const settingsNavItems = document.querySelectorAll('.settings-nav-item');
  const settingsSections = document.querySelectorAll('.settings-section');

  settingsNavItems.forEach(item => {
    item.addEventListener('click', function() {
      const settingId = this.getAttribute('data-setting');

      settingsNavItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      settingsSections.forEach(section => {
        section.classList.add('hidden');
      });

      const targetSection = document.getElementById('setting-' + settingId);
      if (targetSection) {
        targetSection.classList.remove('hidden');
      }
    });
  });
}

function initToggles() {
  const toggles = document.querySelectorAll('.toggle-switch:not(#setting-notifications .toggle-switch):not(#setting-budget .toggle-switch):not(#setting-appearance .toggle-switch)');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  });
}

async function initModules() {
  if (window.billModule) {
    await window.billModule.init();
  }
  if (window.categoryModule) {
    await window.categoryModule.init();
  }
  if (window.homeModule) {
    await window.homeModule.init();
  }
  if (window.aiModule) {
    await window.aiModule.init();
  }
  if (window.settingsModule) {
    await window.settingsModule.init();
  }
}

function initSearch() {
  const searchBar = document.querySelector('.top-header .search-bar input');
  if (!searchBar) return;

  searchBar.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length === 0) return;

    if (window.billModule && window.billModule.bills) {
      const results = window.billModule.bills.filter(bill => 
        bill.categoryName.toLowerCase().includes(query) ||
        bill.description.toLowerCase().includes(query) ||
        bill.subcategory.toLowerCase().includes(query)
      );

      if (results.length > 0) {
        const billsPage = document.getElementById('page-bills');
        const navItems = document.querySelectorAll('.nav-item');
        const pages = document.querySelectorAll('.page');

        navItems.forEach(nav => nav.classList.remove('active'));
        pages.forEach(page => page.classList.add('hidden'));

        const billsNav = document.querySelector('[data-page="bills"]');
        if (billsNav) billsNav.classList.add('active');
        if (billsPage) billsPage.classList.remove('hidden');

        window.billModule.searchQuery = query;
        window.billModule.render();

        const searchInput = document.querySelector('#page-bills .toolbar-search input');
        if (searchInput) searchInput.value = query;
      }
    }
  });

  searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.target.dispatchEvent(new Event('input'));
    }
  });
}

window.refreshAllModules = async function() {
  if (window.homeModule) await window.homeModule.refresh();
  if (window.billModule) await window.billModule.refresh();
  if (window.categoryModule) await window.categoryModule.refresh();
  if (window.aiModule) await window.aiModule.refresh();
  if (window.settingsModule) await window.settingsModule.refresh();
};

function initNetworkStatus() {
  createOfflineIndicator();
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  if (!navigator.onLine) {
    showOfflineIndicator();
  }
}

function createOfflineIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'offline-indicator';
  indicator.className = 'offline-indicator';
  indicator.innerHTML = `
    <i data-lucide="wifi-off" class="icon" style="width: 16px; height: 16px;"></i>
    <span>网络连接已断开，部分功能可能不可用</span>
  `;
  document.body.appendChild(indicator);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function showOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) {
    indicator.classList.add('show');
  }
}

function hideOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) {
    indicator.classList.remove('show');
  }
}

function handleOnline() {
  hideOfflineIndicator();
  window.showToast('网络已恢复连接', 'success');
}

function handleOffline() {
  showOfflineIndicator();
  window.showToast('网络连接已断开', 'warning');
}
