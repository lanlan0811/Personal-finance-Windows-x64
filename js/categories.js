const categoryModule = {
  categories: { expense: [], income: [] },
  currentType: 'expense',
  chart: null,
  
  async init() {
    await this.loadCategories();
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

  bindEvents() {
    const addCategoryBtn = document.querySelector('#page-categories .btn-primary');
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', () => this.showAddModal());
    }

    const categoryTabs = document.querySelectorAll('#page-categories .category-tab');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentType = tab.textContent.includes('支出') ? 'expense' : 'income';
        this.renderCategoryList();
      });
    });
  },

  render() {
    this.renderPieChart();
    this.renderBudget();
    this.renderCategoryList();
  },

  renderPieChart() {
    const chartContainer = document.querySelector('#categories-pie-chart');
    if (!chartContainer) return;

    const stats = this.getCategoryStats();
    const total = Object.values(stats).reduce((sum, s) => sum + s.amount, 0);

    if (total === 0) {
      chartContainer.innerHTML = `
        <div class="pie-center">
          <div class="pie-center-value">¥0</div>
          <div class="pie-center-label">总支出</div>
        </div>
      `;
      return;
    }

    const colors = [];
    const categoryNames = [];
    const categories = this.categories.expense;
    
    Object.keys(stats).forEach(categoryId => {
      const category = categories.find(c => c.id === categoryId);
      colors.push(category?.color || '#6b7280');
      categoryNames.push(stats[categoryId].categoryName || category?.name || '其他');
    });

    const gradientStops = [];
    let currentAngle = 0;
    const data = Object.values(stats);
    
    data.forEach((item, index) => {
      const percentage = (item.amount / total) * 360;
      gradientStops.push(`${colors[index]} ${currentAngle}deg ${currentAngle + percentage}deg`);
      currentAngle += percentage;
    });

    chartContainer.innerHTML = `
      <div class="pie-chart" style="background: conic-gradient(${gradientStops.join(', ')})">
        <div class="pie-center">
          <div class="pie-center-value">¥${total.toLocaleString()}</div>
          <div class="pie-center-label">总支出</div>
        </div>
      </div>
      <div class="pie-legend">
        ${data.map((item, index) => `
          <div class="pie-legend-item">
            <div class="pie-legend-color" style="background: ${colors[index]}"></div>
            <span class="pie-legend-name">${categoryNames[index]}</span>
            <span class="pie-legend-value">¥${item.amount.toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
    `;

    if (!document.querySelector('#pie-chart-style')) {
      const style = document.createElement('style');
      style.id = 'pie-chart-style';
      style.textContent = `
        #categories-pie-chart {
          flex-direction: column;
          gap: 20px;
          height: auto;
          min-height: 260px;
          background: transparent;
        }
        #categories-pie-chart::before {
          display: none;
        }
        .pie-chart {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .pie-chart::before {
          content: '';
          position: absolute;
          inset: 35px;
          background: linear-gradient(135deg, #1e1e3f 0%, #2d2d5a 100%);
          border-radius: 50%;
          box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .pie-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .pie-center-value {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }
        .pie-center-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        .pie-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-top: 10px;
        }
        .pie-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        .pie-legend-color {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }
        .pie-legend-name {
          color: rgba(255, 255, 255, 0.8);
        }
        .pie-legend-value {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }
      `;
      document.head.appendChild(style);
    }
  },

  renderBudget() {
    const budgetCard = document.querySelector('#page-categories .budget-card');
    if (!budgetCard) return;

    const stats = this.getCategoryStats();
    const totalExpense = Object.values(stats).reduce((sum, s) => sum + s.amount, 0);
    
    window.db.getSetting('budget').then(budget => {
      const monthlyBudget = budget?.monthly || 20000;
      const percentage = Math.min((totalExpense / monthlyBudget) * 100, 100);
      
      budgetCard.innerHTML = `
        <h3>月度预算</h3>
        <div class="budget-summary">
          <span>已使用</span>
          <span class="amount">${percentage.toFixed(0)}%</span>
        </div>
        <div class="budget-bar">
          <div class="budget-bar-fill" style="width: ${percentage}%; ${percentage > 80 ? 'background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);' : ''}"></div>
        </div>
        <div class="budget-detail">
          <span>¥${totalExpense.toLocaleString()} / ¥${monthlyBudget.toLocaleString()}</span>
        </div>
      `;
    });
  },

  renderCategoryList() {
    const listContainer = document.querySelector('#page-categories .categories-list');
    const headerCount = document.querySelector('#page-categories .categories-count');
    if (!listContainer) return;

    const categories = this.categories[this.currentType];
    const stats = this.getCategoryStats();
    
    if (headerCount) {
      headerCount.textContent = `${categories.length} 个分类`;
    }

    if (categories.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <i data-lucide="grid-3x3" class="icon"></i>
          <h3>暂无分类</h3>
          <p>点击上方"添加分类"按钮创建新分类</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }

    const maxAmount = Math.max(...categories.map(c => stats[c.id]?.amount || 0));

    let html = '';
    categories.forEach(category => {
      const stat = stats[category.id] || { amount: 0, count: 0 };
      const percentage = maxAmount > 0 ? (stat.amount / maxAmount) * 100 : 0;

      html += `
        <div class="category-row" data-id="${category.id}">
          <div class="category-row-icon" style="background: ${category.color}20;">
            <i data-lucide="${category.icon}" class="icon" style="width: 22px; height: 22px; color: ${category.color};"></i>
          </div>
          <div class="category-row-info">
            <h4>${category.name}</h4>
            <p>${category.subcategories?.join('、') || '无子分类'}</p>
          </div>
          <div class="category-row-bar">
            <div class="category-bar">
              <div class="category-bar-fill" style="width: ${percentage}%; background: ${category.color};"></div>
            </div>
          </div>
          <div class="category-row-amount">¥${stat.amount.toLocaleString()}</div>
          <div class="category-actions">
            <button class="category-action-btn edit-btn" data-id="${category.id}" title="编辑">
              <i data-lucide="pencil" class="icon"></i>
            </button>
            <button class="category-action-btn delete-btn" data-id="${category.id}" title="删除">
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

    this.bindCategoryItemEvents();
  },

  bindCategoryItemEvents() {
    document.querySelectorAll('.category-row .edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.showEditModal(id);
      });
    });

    document.querySelectorAll('.category-row .delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.deleteCategory(id);
      });
    });
  },

  getCategoryStats() {
    const stats = {};
    
    if (!window.billModule || !window.billModule.bills) {
      return stats;
    }

    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    const monthBills = window.billModule.bills.filter(b => b.month === currentMonth && b.type === 'expense');

    monthBills.forEach(bill => {
      if (!stats[bill.categoryId]) {
        stats[bill.categoryId] = { amount: 0, count: 0 };
      }
      stats[bill.categoryId].amount += bill.amount;
      stats[bill.categoryId].count++;
    });

    return stats;
  },

  showAddModal() {
    window.showCategoryModal(null);
  },

  showEditModal(id) {
    const allCategories = [...this.categories.expense, ...this.categories.income];
    const category = allCategories.find(c => c.id === id);
    if (category) {
      window.showCategoryModal(category);
    }
  },

  async addCategory(categoryData) {
    try {
      const newCategory = await window.db.addCategory(categoryData);
      if (categoryData.type === 'expense') {
        this.categories.expense.push(newCategory);
      } else {
        this.categories.income.push(newCategory);
      }
      this.render();
      window.showToast('分类添加成功', 'success');
    } catch (error) {
      console.error('添加分类失败:', error);
      window.showToast('添加分类失败', 'error');
    }
  },

  async updateCategory(categoryData) {
    try {
      const updatedCategory = await window.db.updateCategory(categoryData);
      
      const list = categoryData.type === 'expense' ? this.categories.expense : this.categories.income;
      const index = list.findIndex(c => c.id === categoryData.id);
      if (index !== -1) {
        list[index] = updatedCategory;
      }
      
      this.render();
      window.showToast('分类更新成功', 'success');
    } catch (error) {
      console.error('更新分类失败:', error);
      window.showToast('更新分类失败', 'error');
    }
  },

  async deleteCategory(id) {
    const allCategories = [...this.categories.expense, ...this.categories.income];
    const category = allCategories.find(c => c.id === id);
    
    if (!category) return;

    const bills = await window.db.getBillsByCategory(id);
    if (bills.length > 0) {
      window.showToast(`该分类下有 ${bills.length} 条账单，无法删除`, 'warning');
      return;
    }

    window.showConfirmModal('删除分类', `确定要删除"${category.name}"分类吗？`, async () => {
      try {
        await window.db.deleteCategory(id);
        
        if (category.type === 'expense') {
          this.categories.expense = this.categories.expense.filter(c => c.id !== id);
        } else {
          this.categories.income = this.categories.income.filter(c => c.id !== id);
        }
        
        this.render();
        window.showToast('分类已删除', 'success');
      } catch (error) {
        console.error('删除分类失败:', error);
        window.showToast('删除分类失败', 'error');
      }
    });
  },

  async refresh() {
    await this.loadCategories();
    this.render();
  }
};

window.categoryModule = categoryModule;
