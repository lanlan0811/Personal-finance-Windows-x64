const billModule = {
  bills: [],
  categories: { expense: [], income: [] },
  currentFilter: 'all',
  currentSort: 'date',
  searchQuery: '',
  currentPage: 1,
  itemsPerPage: 10,
  
  async init() {
    await this.loadCategories();
    await this.loadBills();
    this.bindEvents();
    this.render();
  },

  async loadCategories() {
    const expenseCategories = await window.db.getCategoriesByType('expense');
    const incomeCategories = await window.db.getCategoriesByType('income');
    this.categories = {
      expense: expenseCategories,
      income: incomeCategories
    };
  },

  async loadBills() {
    this.bills = await window.db.getAllBills();
    this.sortBills();
  },

  sortBills() {
    this.bills.sort((a, b) => {
      if (this.currentSort === 'date') {
        return new Date(b.date) - new Date(a.date);
      } else if (this.currentSort === 'amount') {
        return b.amount - a.amount;
      }
      return 0;
    });
  },

  bindEvents() {
    const addBillBtn = document.querySelector('#page-bills .btn-primary');
    if (addBillBtn) {
      addBillBtn.addEventListener('click', () => this.showAddModal());
    }

    const filterTabs = document.querySelectorAll('#page-bills .filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.textContent.trim() === '全部' ? 'all' : 
                            tab.textContent.trim() === '收入' ? 'income' : 'expense';
        this.currentPage = 1;
        this.render();
      });
    });

    const searchInput = document.querySelector('#page-bills .toolbar-search input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.render();
      });
    }

    const sortSelect = document.querySelector('#page-bills .sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('click', () => {
        this.currentSort = this.currentSort === 'date' ? 'amount' : 'date';
        sortSelect.querySelector('span').textContent = this.currentSort === 'date' ? '按日期' : '按金额';
        this.sortBills();
        this.currentPage = 1;
        this.render();
      });
    }
  },

  getFilteredBills() {
    let filtered = [...this.bills];

    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(bill => bill.type === this.currentFilter);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(bill => 
        bill.categoryName.toLowerCase().includes(this.searchQuery) ||
        bill.description.toLowerCase().includes(this.searchQuery) ||
        bill.subcategory.toLowerCase().includes(this.searchQuery)
      );
    }

    return filtered;
  },

  getPaginatedBills() {
    const filtered = this.getFilteredBills();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return {
      bills: filtered.slice(start, end),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / this.itemsPerPage)
    };
  },

  render() {
    this.renderSummary();
    this.renderList();
  },

  renderSummary() {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    
    const monthBills = this.bills.filter(bill => bill.month === currentMonth);
    const income = monthBills.filter(b => b.type === 'income').reduce((sum, b) => sum + b.amount, 0);
    const expense = monthBills.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0);
    const net = income - expense;

    const summaryCards = document.querySelectorAll('#page-bills .summary-value');
    if (summaryCards.length >= 3) {
      summaryCards[0].textContent = `¥${income.toLocaleString()}`;
      summaryCards[1].textContent = `¥${expense.toLocaleString()}`;
      summaryCards[2].textContent = `¥${net.toLocaleString()}`;
    }
  },

  renderList() {
    const listContainer = document.querySelector('#page-bills .bills-list');
    if (!listContainer) return;

    const { bills: paginatedBills, total, totalPages } = this.getPaginatedBills();

    if (paginatedBills.length === 0 && this.currentPage === 1) {
      listContainer.innerHTML = `
        <div class="bill-header">
          <span>账单</span>
          <span>日期</span>
          <span>金额</span>
        </div>
        <div class="empty-state">
          <i data-lucide="receipt" class="icon"></i>
          <h3>暂无账单记录</h3>
          <p>点击上方"添加账单"按钮开始记账</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }

    let html = `
      <div class="bill-header">
        <span>账单</span>
        <span>日期</span>
        <span>金额</span>
      </div>
    `;

    paginatedBills.forEach(bill => {
      const category = this.getCategoryById(bill.categoryId);
      const icon = category?.icon || 'circle';
      const color = category?.color || '#6b7280';
      const date = new Date(bill.date);
      const dateStr = this.formatDate(date);
      const isExpense = bill.type === 'expense';

      html += `
        <div class="bill-item" data-id="${bill.id}">
          <div class="bill-info">
            <div class="bill-icon" style="background: ${color}20;">
              <i data-lucide="${icon}" class="icon" style="width: 24px; height: 24px; color: ${color};"></i>
            </div>
            <div class="bill-details">
              <h4>${bill.description || bill.categoryName}</h4>
              <p>${bill.categoryName}${bill.subcategory ? ' · ' + bill.subcategory : ''}</p>
            </div>
          </div>
          <div class="bill-date">${dateStr}</div>
          <div class="bill-amount ${isExpense ? 'expense' : 'income'}">
            ${isExpense ? '-' : '+'}¥${bill.amount.toLocaleString()}
          </div>
          <div class="bill-actions">
            <button class="bill-action-btn edit-btn" data-id="${bill.id}" title="编辑">
              <i data-lucide="pencil" class="icon"></i>
            </button>
            <button class="bill-action-btn delete-btn" data-id="${bill.id}" title="删除">
              <i data-lucide="trash-2" class="icon"></i>
            </button>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    this.bindBillItemEvents();
    this.renderPagination(total, totalPages);
  },

  renderPagination(total, totalPages) {
    const paginationContainer = document.getElementById('bills-pagination');
    if (!paginationContainer || totalPages <= 1) {
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
      return;
    }

    let html = '';

    html += `<button class="pagination-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
      <i data-lucide="chevron-left" class="icon" style="width: 16px; height: 16px;"></i>
    </button>`;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      html += `<button class="pagination-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        html += `<span class="pagination-info">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="pagination-info">...</span>`;
      }
      html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="pagination-btn" data-page="next" ${this.currentPage === totalPages ? 'disabled' : ''}>
      <i data-lucide="chevron-right" class="icon" style="width: 16px; height: 16px;"></i>
    </button>`;

    html += `<span class="pagination-info">共 ${total} 条</span>`;

    paginationContainer.innerHTML = html;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        
        if (page === 'prev' && this.currentPage > 1) {
          this.currentPage--;
        } else if (page === 'next' && this.currentPage < totalPages) {
          this.currentPage++;
        } else if (!isNaN(page)) {
          this.currentPage = parseInt(page);
        }

        this.renderList();
        
        const billsList = document.querySelector('.bills-list');
        if (billsList) {
          billsList.scrollTop = 0;
        }
      });
    });
  },

  bindBillItemEvents() {
    document.querySelectorAll('.bill-item .edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.showEditModal(id);
      });
    });

    document.querySelectorAll('.bill-item .delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.deleteBill(id);
      });
    });

    document.querySelectorAll('.bill-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        this.showDetail(id);
      });
    });
  },

  getCategoryById(id) {
    const allCategories = [...this.categories.expense, ...this.categories.income];
    return allCategories.find(c => c.id === id);
  },

  formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const billDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (billDate.getTime() === today.getTime()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (billDate.getTime() === yesterday.getTime()) {
      return '昨天';
    }

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  showAddModal() {
    window.showBillModal(null, this.categories);
  },

  async showEditModal(id) {
    const bill = this.bills.find(b => b.id === id);
    if (bill) {
      window.showBillModal(bill, this.categories);
    }
  },

  async addBill(billData) {
    try {
      const newBill = await window.db.addBill(billData);
      this.bills.unshift(newBill);
      this.sortBills();
      this.render();
      window.showToast('账单添加成功', 'success');
      
      if (window.homeModule) {
        window.homeModule.refresh();
      }
      if (window.categoryModule) {
        window.categoryModule.refresh();
      }
    } catch (error) {
      console.error('添加账单失败:', error);
      window.showToast('添加账单失败', 'error');
    }
  },

  async updateBill(billData) {
    try {
      const updatedBill = await window.db.updateBill(billData);
      const index = this.bills.findIndex(b => b.id === billData.id);
      if (index !== -1) {
        this.bills[index] = updatedBill;
        this.sortBills();
        this.render();
        window.showToast('账单更新成功', 'success');
        
        if (window.homeModule) {
          window.homeModule.refresh();
        }
        if (window.categoryModule) {
          window.categoryModule.refresh();
        }
      }
    } catch (error) {
      console.error('更新账单失败:', error);
      window.showToast('更新账单失败', 'error');
    }
  },

  async deleteBill(id) {
    window.showConfirmModal('删除账单', '确定要删除这条账单记录吗？此操作不可撤销。', async () => {
      try {
        await window.db.deleteBill(id);
        this.bills = this.bills.filter(b => b.id !== id);
        this.render();
        window.showToast('账单已删除', 'success');
        
        if (window.homeModule) {
          window.homeModule.refresh();
        }
        if (window.categoryModule) {
          window.categoryModule.refresh();
        }
      } catch (error) {
        console.error('删除账单失败:', error);
        window.showToast('删除账单失败', 'error');
      }
    });
  },

  showDetail(id) {
    const bill = this.bills.find(b => b.id === id);
    if (!bill) return;

    const category = this.getCategoryById(bill.categoryId);
    const date = new Date(bill.date);
    
    const content = `
      <div class="bill-detail">
        <div class="detail-header">
          <div class="detail-icon" style="background: ${category?.color || '#6b7280'}20;">
            <i data-lucide="${category?.icon || 'circle'}" class="icon" style="width: 32px; height: 32px; color: ${category?.color || '#6b7280'};"></i>
          </div>
          <div class="detail-amount ${bill.type === 'expense' ? 'expense' : 'income'}">
            ${bill.type === 'expense' ? '-' : '+'}¥${bill.amount.toLocaleString()}
          </div>
        </div>
        <div class="detail-info">
          <div class="detail-row">
            <span class="detail-label">类型</span>
            <span class="detail-value">${bill.type === 'expense' ? '支出' : '收入'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">分类</span>
            <span class="detail-value">${bill.categoryName}</span>
          </div>
          ${bill.subcategory ? `
          <div class="detail-row">
            <span class="detail-label">子分类</span>
            <span class="detail-value">${bill.subcategory}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">日期</span>
            <span class="detail-value">${date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          ${bill.description ? `
          <div class="detail-row">
            <span class="detail-label">备注</span>
            <span class="detail-value">${bill.description}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">${new Date(bill.createdAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>
    `;

    const modal = new window.Modal({
      title: '账单详情',
      content,
      width: '400px',
      confirmText: '关闭',
      showCancel: false
    });

    modal.show();

    const style = document.createElement('style');
    style.textContent = `
      .bill-detail { padding: 10px 0; }
      .detail-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
      .detail-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
      .detail-amount { font-size: 32px; font-weight: 700; }
      .detail-amount.expense { color: #ef4444; }
      .detail-amount.income { color: #10b981; }
      .detail-info { display: flex; flex-direction: column; gap: 12px; }
      .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .detail-label { color: rgba(255,255,255,0.6); font-size: 14px; }
      .detail-value { color: #ffffff; font-size: 14px; font-weight: 500; }
    `;
    document.head.appendChild(style);
  },

  async refresh() {
    await this.loadCategories();
    await this.loadBills();
    this.render();
  }
};

window.billModule = billModule;
