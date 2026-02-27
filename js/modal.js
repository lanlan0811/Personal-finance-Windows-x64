class Modal {
  constructor(options = {}) {
    this.id = options.id || 'modal-' + Date.now();
    this.title = options.title || '';
    this.content = options.content || '';
    this.width = options.width || '500px';
    this.onClose = options.onClose || null;
    this.onConfirm = options.onConfirm || null;
    this.confirmText = options.confirmText || '确定';
    this.cancelText = options.cancelText || '取消';
    this.showCancel = options.showCancel !== false;
    this.element = null;
  }

  show() {
    if (this.element) {
      this.element.classList.add('show');
      return;
    }

    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    this.element.id = this.id;
    this.element.innerHTML = `
      <div class="modal-container" style="width: ${this.width}">
        <div class="modal-header">
          <h3 class="modal-title">${this.title}</h3>
          <button class="modal-close" data-action="close">
            <i data-lucide="x" class="icon"></i>
          </button>
        </div>
        <div class="modal-body">
          ${this.content}
        </div>
        <div class="modal-footer">
          ${this.showCancel ? `<button class="btn-secondary" data-action="cancel">${this.cancelText}</button>` : ''}
          <button class="btn-primary" data-action="confirm">${this.confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    this.bindEvents();
    
    requestAnimationFrame(() => {
      this.element.classList.add('show');
    });
  }

  bindEvents() {
    this.element.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      
      if (action === 'close' || action === 'cancel') {
        this.close();
      } else if (action === 'confirm') {
        if (this.onConfirm) {
          const result = this.onConfirm();
          if (result !== false) {
            this.close();
          }
        } else {
          this.close();
        }
      }
    });

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.element?.classList.contains('show')) {
        this.close();
      }
    });
  }

  close() {
    if (this.element) {
      this.element.classList.remove('show');
      setTimeout(() => {
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
      }, 300);
    }
    if (this.onClose) {
      this.onClose();
    }
  }

  setContent(content) {
    const body = this.element?.querySelector('.modal-body');
    if (body) {
      body.innerHTML = content;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }
}

function showBillModal(bill = null, categories = { expense: [], income: [] }) {
  const isEdit = bill !== null;
  const title = isEdit ? '编辑账单' : '添加账单';
  
  const expenseCategories = categories.expense || [];
  const incomeCategories = categories.income || [];
  
  const content = `
    <form id="bill-form" class="modal-form">
      <div class="form-group">
        <label class="form-label">类型</label>
        <div class="type-tabs">
          <button type="button" class="type-tab ${!isEdit || bill?.type === 'expense' ? 'active' : ''}" data-type="expense">
            <i data-lucide="trending-down" class="icon"></i>
            支出
          </button>
          <button type="button" class="type-tab ${isEdit && bill?.type === 'income' ? 'active' : ''}" data-type="income">
            <i data-lucide="trending-up" class="icon"></i>
            收入
          </button>
        </div>
        <input type="hidden" id="bill-type" name="type" value="${isEdit ? bill.type : 'expense'}">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="bill-amount">金额</label>
        <div class="amount-input-wrapper">
          <span class="currency-symbol">¥</span>
          <input type="number" id="bill-amount" name="amount" class="form-input amount-input" 
                 placeholder="0.00" step="0.01" min="0.01" max="999999999.99" required
                 value="${isEdit ? bill.amount : ''}">
        </div>
        <span class="form-error" id="amount-error"></span>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="bill-category">分类</label>
        <select id="bill-category" name="categoryId" class="form-select" required>
          <option value="">请选择分类</option>
          <optgroup label="支出分类" id="expense-category-group">
            ${expenseCategories.map(c => `
              <option value="${c.id}" data-type="expense" ${isEdit && bill?.categoryId === c.id ? 'selected' : ''}>
                ${c.name}
              </option>
            `).join('')}
          </optgroup>
          <optgroup label="收入分类" id="income-category-group">
            ${incomeCategories.map(c => `
              <option value="${c.id}" data-type="income" ${isEdit && bill?.categoryId === c.id ? 'selected' : ''}>
                ${c.name}
              </option>
            `).join('')}
          </optgroup>
        </select>
        <span class="form-error" id="category-error"></span>
      </div>
      
      <div class="form-group" id="subcategory-group" style="display: none;">
        <label class="form-label" for="bill-subcategory">子分类</label>
        <select id="bill-subcategory" name="subcategory" class="form-select">
          <option value="">请选择子分类</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="bill-date">日期</label>
        <input type="date" id="bill-date" name="date" class="form-input" required
               value="${isEdit ? bill.date.split('T')[0] : new Date().toISOString().split('T')[0]}">
        <span class="form-error" id="date-error"></span>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="bill-description">备注</label>
        <textarea id="bill-description" name="description" class="form-textarea" 
                  placeholder="添加备注信息..." rows="2" maxlength="200">${isEdit ? (bill.description || '') : ''}</textarea>
        <span class="form-hint">最多200字</span>
      </div>
      
      ${isEdit ? `<input type="hidden" name="id" value="${bill.id}">` : ''}
    </form>
  `;

  const modal = new Modal({
    title,
    content,
    width: '450px',
    confirmText: isEdit ? '保存' : '添加',
    onConfirm: () => {
      const form = document.getElementById('bill-form');
      const formData = new FormData(form);
      
      clearErrors();
      
      const type = formData.get('type');
      const amount = parseFloat(formData.get('amount'));
      const categoryId = formData.get('categoryId');
      const categorySelect = document.getElementById('bill-category');
      const selectedOption = categorySelect.options[categorySelect.selectedIndex];
      const categoryName = selectedOption.text;
      const subcategory = formData.get('subcategory') || '';
      const date = formData.get('date');
      const description = formData.get('description');
      
      if (!validateAmount(amount)) {
        return false;
      }
      
      if (!categoryId) {
        showError('category-error', '请选择分类');
        return false;
      }
      
      if (!validateDate(date)) {
        return false;
      }
      
      const billData = {
        type,
        amount,
        categoryId,
        categoryName,
        subcategory,
        date: new Date(date).toISOString(),
        description: description.trim()
      };
      
      if (isEdit) {
        billData.id = formData.get('id');
        billData.createdAt = bill.createdAt;
      }
      
      if (window.billModule) {
        if (isEdit) {
          window.billModule.updateBill(billData);
        } else {
          window.billModule.addBill(billData);
        }
      }
      
      return true;
    }
  });

  function validateAmount(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
      showError('amount-error', '请输入有效金额');
      return false;
    }
    if (amount <= 0) {
      showError('amount-error', '金额必须大于0');
      return false;
    }
    if (amount > 999999999.99) {
      showError('amount-error', '金额超出限制');
      return false;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
      showError('amount-error', '金额最多保留两位小数');
      return false;
    }
    return true;
  }

  function validateDate(dateStr) {
    if (!dateStr) {
      showError('date-error', '请选择日期');
      return false;
    }
    
    const date = new Date(dateStr);
    const today = new Date();
    const minDate = new Date('2000-01-01');
    const maxDate = new Date(today.getFullYear() + 10, 11, 31);
    
    if (isNaN(date.getTime())) {
      showError('date-error', '日期格式无效');
      return false;
    }
    
    if (date < minDate) {
      showError('date-error', '日期不能早于2000年');
      return false;
    }
    
    if (date > maxDate) {
      showError('date-error', '日期超出有效范围');
      return false;
    }
    
    return true;
  }

  function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  modal.show();

  setTimeout(() => {
    const typeTabs = modal.element.querySelectorAll('.type-tab');
    const typeInput = document.getElementById('bill-type');
    const categorySelect = document.getElementById('bill-category');
    const subcategoryGroup = document.getElementById('subcategory-group');
    const subcategorySelect = document.getElementById('bill-subcategory');
    const amountInput = document.getElementById('bill-amount');
    
    amountInput.addEventListener('input', () => {
      const errorEl = document.getElementById('amount-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
    });
    
    typeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        typeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const type = tab.dataset.type;
        typeInput.value = type;
        
        const expenseGroup = document.getElementById('expense-category-group');
        const incomeGroup = document.getElementById('income-category-group');
        
        if (type === 'expense') {
          expenseGroup.style.display = '';
          incomeGroup.style.display = 'none';
          const firstExpense = expenseGroup.querySelector('option[value]');
          if (firstExpense) {
            categorySelect.value = firstExpense.value;
            updateSubcategories(firstExpense.value);
          }
        } else {
          expenseGroup.style.display = 'none';
          incomeGroup.style.display = '';
          const firstIncome = incomeGroup.querySelector('option[value]');
          if (firstIncome) {
            categorySelect.value = firstIncome.value;
            updateSubcategories(firstIncome.value);
          }
        }
      });
    });

    function updateSubcategories(categoryId) {
      const category = [...expenseCategories, ...incomeCategories].find(c => c.id === categoryId);
      
      if (category && category.subcategories && category.subcategories.length > 0) {
        subcategoryGroup.style.display = '';
        subcategorySelect.innerHTML = `
          <option value="">请选择子分类</option>
          ${category.subcategories.map(sub => `<option value="${sub}">${sub}</option>`).join('')}
        `;
        
        if (isEdit && bill.subcategory) {
          subcategorySelect.value = bill.subcategory;
        }
      } else {
        subcategoryGroup.style.display = 'none';
        subcategorySelect.innerHTML = '<option value="">请选择子分类</option>';
      }
    }

    categorySelect.addEventListener('change', () => {
      updateSubcategories(categorySelect.value);
      const errorEl = document.getElementById('category-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
    });

    if (isEdit && bill.categoryId) {
      updateSubcategories(bill.categoryId);
    } else if (expenseCategories.length > 0) {
      updateSubcategories(expenseCategories[0].id);
    }
  }, 100);

  return modal;
}

function showCategoryModal(category = null) {
  const isEdit = category !== null;
  const title = isEdit ? '编辑分类' : '添加分类';
  
  const content = `
    <form id="category-form" class="modal-form">
      <div class="form-group">
        <label class="form-label">类型</label>
        <div class="type-tabs">
          <button type="button" class="type-tab ${!isEdit || category?.type === 'expense' ? 'active' : ''}" data-type="expense">
            支出
          </button>
          <button type="button" class="type-tab ${isEdit && category?.type === 'income' ? 'active' : ''}" data-type="income">
            收入
          </button>
        </div>
        <input type="hidden" id="category-type" name="type" value="${isEdit ? category.type : 'expense'}">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="category-name">分类名称</label>
        <input type="text" id="category-name" name="name" class="form-input" 
               placeholder="请输入分类名称" required maxlength="20"
               value="${isEdit ? category.name : ''}">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="category-icon">图标</label>
        <div class="icon-selector" id="icon-selector">
          ${['utensils', 'home', 'car', 'shopping-bag', 'gamepad-2', 'heart-pulse', 'book-open', 
             'wallet', 'trophy', 'trending-up', 'briefcase', 'gift', 'plane', 'music', 
             'coffee', 'smartphone', 'monitor', 'shirt', 'sparkles', 'more-horizontal'].map(icon => `
            <div class="icon-option ${isEdit && category?.icon === icon ? 'selected' : ''}" data-icon="${icon}">
              <i data-lucide="${icon}" class="icon"></i>
            </div>
          `).join('')}
        </div>
        <input type="hidden" id="category-icon" name="icon" value="${isEdit ? category.icon : 'circle'}">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="category-color">颜色</label>
        <div class="color-selector" id="color-selector">
          ${['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#667eea', '#ec4899', 
             '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7'].map(color => `
            <div class="color-option ${isEdit && category?.color === color ? 'selected' : ''}" 
                 data-color="${color}" style="background: ${color}"></div>
          `).join('')}
        </div>
        <input type="hidden" id="category-color" name="color" value="${isEdit ? category.color : '#6b7280'}">
      </div>
      
      <div class="form-group">
        <label class="form-label">子分类（可选）</label>
        <div id="subcategories-container" class="subcategories-container">
          ${(isEdit && category.subcategories ? category.subcategories : []).map((sub, index) => `
            <div class="subcategory-item" data-index="${index}">
              <input type="text" name="subcategory" class="form-input subcategory-input" 
                     value="${sub}" placeholder="子分类名称">
              <button type="button" class="remove-subcategory" data-index="${index}">
                <i data-lucide="x" class="icon"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <button type="button" id="add-subcategory" class="btn-text">
          <i data-lucide="plus" class="icon"></i>
          添加子分类
        </button>
      </div>
      
      ${isEdit ? `<input type="hidden" name="id" value="${category.id}">` : ''}
    </form>
  `;

  const modal = new Modal({
    title,
    content,
    width: '450px',
    confirmText: isEdit ? '保存' : '添加',
    onConfirm: () => {
      const form = document.getElementById('category-form');
      const formData = new FormData(form);
      
      const type = formData.get('type');
      const name = formData.get('name').trim();
      const icon = formData.get('icon');
      const color = formData.get('color');
      
      const subcategoryInputs = document.querySelectorAll('.subcategory-input');
      const subcategories = Array.from(subcategoryInputs)
        .map(input => input.value.trim())
        .filter(v => v);
      
      if (!name) {
        showToast('请输入分类名称', 'error');
        return false;
      }
      
      if (name.length > 20) {
        showToast('分类名称不能超过20个字符', 'error');
        return false;
      }
      
      if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(name)) {
        showToast('分类名称只能包含中文、字母和数字', 'error');
        return false;
      }
      
      if (subcategories.length > 10) {
        showToast('子分类数量不能超过10个', 'error');
        return false;
      }
      
      for (const sub of subcategories) {
        if (sub.length > 15) {
          showToast('子分类名称不能超过15个字符', 'error');
          return false;
        }
        if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(sub)) {
          showToast('子分类名称只能包含中文、字母和数字', 'error');
          return false;
        }
      }
      
      const categoryData = {
        type,
        name,
        icon,
        color,
        subcategories
      };
      
      if (isEdit) {
        categoryData.id = formData.get('id');
        categoryData.createdAt = category.createdAt;
      }
      
      if (window.categoryModule) {
        if (isEdit) {
          window.categoryModule.updateCategory(categoryData);
        } else {
          window.categoryModule.addCategory(categoryData);
        }
      }
      
      return true;
    }
  });

  modal.show();

  setTimeout(() => {
    const typeTabs = modal.element.querySelectorAll('.type-tab');
    const typeInput = document.getElementById('category-type');
    const iconSelector = document.getElementById('icon-selector');
    const iconInput = document.getElementById('category-icon');
    const colorSelector = document.getElementById('color-selector');
    const colorInput = document.getElementById('category-color');
    const subcategoriesContainer = document.getElementById('subcategories-container');
    const addSubcategoryBtn = document.getElementById('add-subcategory');
    
    typeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        typeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        typeInput.value = tab.dataset.type;
      });
    });

    iconSelector.addEventListener('click', (e) => {
      const option = e.target.closest('.icon-option');
      if (option) {
        iconSelector.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        iconInput.value = option.dataset.icon;
      }
    });

    colorSelector.addEventListener('click', (e) => {
      const option = e.target.closest('.color-option');
      if (option) {
        colorSelector.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        colorInput.value = option.dataset.color;
      }
    });

    let subcategoryIndex = subcategoriesContainer.children.length;
    
    addSubcategoryBtn.addEventListener('click', () => {
      const item = document.createElement('div');
      item.className = 'subcategory-item';
      item.dataset.index = subcategoryIndex;
      item.innerHTML = `
        <input type="text" name="subcategory" class="form-input subcategory-input" 
               placeholder="子分类名称">
        <button type="button" class="remove-subcategory" data-index="${subcategoryIndex}">
          <i data-lucide="x" class="icon"></i>
        </button>
      `;
      subcategoriesContainer.appendChild(item);
      subcategoryIndex++;
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });

    subcategoriesContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-subcategory');
      if (removeBtn) {
        removeBtn.closest('.subcategory-item').remove();
      }
    });
  }, 100);

  return modal;
}

function showConfirmModal(title, message, onConfirm) {
  const content = `<p class="confirm-message">${message}</p>`;
  
  const modal = new Modal({
    title,
    content,
    width: '400px',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm
  });

  modal.show();
  return modal;
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  };
  
  toast.innerHTML = `
    <i data-lucide="${icons[type] || icons.info}" class="icon"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

window.Modal = Modal;
window.showBillModal = showBillModal;
window.showCategoryModal = showCategoryModal;
window.showConfirmModal = showConfirmModal;
window.showToast = showToast;
