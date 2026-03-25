const elements = {
  copyBtn: document.getElementById('copy-env'),
  envTemplate: document.getElementById('env-template'),
  providerTabs: document.querySelectorAll('.provider-tab'),
  providerContents: document.querySelectorAll('.provider-content'),
  btnDone: document.getElementById('btn-done'),
  btnSkip: document.getElementById('btn-skip')
};

function init() {
  setupCopyButton();
  setupProviderTabs();
  setupActionButtons();
}

function setupCopyButton() {
  elements.copyBtn.addEventListener('click', async () => {
    const text = elements.envTemplate.textContent;
    
    try {
      await navigator.clipboard.writeText(text);
      
      elements.copyBtn.classList.add('copied');
      elements.copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        已复制
      `;
      
      showToast('配置模板已复制到剪贴板', 'success');
      
      setTimeout(() => {
        elements.copyBtn.classList.remove('copied');
        elements.copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          复制
        `;
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      showToast('复制失败，请手动选择复制', 'error');
    }
  });
}

function setupProviderTabs() {
  elements.providerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const provider = tab.dataset.provider;
      
      elements.providerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      elements.providerContents.forEach(content => {
        content.classList.remove('active');
        if (content.dataset.provider === provider) {
          content.classList.add('active');
        }
      });
    });
  });
}

function setupActionButtons() {
  elements.btnDone.addEventListener('click', () => {
    if (window.electronAPI && window.electronAPI.closeSetup) {
      showToast('配置完成，正在启动应用...', 'success');
      setTimeout(() => {
        window.electronAPI.closeSetup();
      }, 1000);
    } else {
      showToast('请重启应用以加载新配置', 'success');
      setTimeout(() => {
        window.close();
      }, 1500);
    }
  });
  
  elements.btnSkip.addEventListener('click', () => {
    if (window.electronAPI && window.electronAPI.skipSetup) {
      showToast('正在启动应用...', 'success');
      setTimeout(() => {
        window.electronAPI.skipSetup();
      }, 500);
    } else {
      localStorage.setItem('ai_setup_skipped', 'true');
      showToast('您可以稍后在设置中配置', 'success');
      setTimeout(() => {
        window.close();
      }, 1500);
    }
  });
}

function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconSvg = type === 'success' 
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  
  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
