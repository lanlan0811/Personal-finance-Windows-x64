const homeModule = {
  stats: null,
  trendChart: null,
  
  async init() {
    await this.loadData();
    this.bindEvents();
    this.render();
  },

  async loadData() {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    this.stats = await window.db.getMonthlyStats(currentMonth);
  },

  bindEvents() {
    const addBillBtn = document.querySelector('#page-home .btn-primary');
    if (addBillBtn) {
      addBillBtn.addEventListener('click', () => {
        if (window.billModule) {
          window.billModule.showAddModal();
        }
      });
    }
  },

  render() {
    this.renderStats();
    this.renderTrendChart();
    this.renderCategoryList();
    this.renderSavingsGoal();
  },

  renderStats() {
    const statCards = document.querySelectorAll('#page-home .stat-card');
    if (statCards.length < 3) return;

    const income = this.stats.income;
    const expense = this.stats.expense;
    const balance = this.stats.balance;

    const balanceCard = statCards[0];
    const balanceValue = balanceCard.querySelector('.stat-value');
    const balanceChange = balanceCard.querySelector('.stat-change span');
    const balanceFooter = balanceCard.querySelector('.stat-footer');
    
    if (balanceValue) {
      balanceValue.textContent = `¥${balance.toLocaleString()}`;
    }
    if (balanceChange) {
      balanceChange.textContent = balance >= 0 ? `+${((balance / (income || 1)) * 100).toFixed(1)}% 本月` : `${((balance / (income || 1)) * 100).toFixed(1)}% 本月`;
    }
    if (balanceFooter) {
      balanceFooter.textContent = balance >= 0 ? `较上月增加 ¥${Math.abs(balance).toLocaleString()}` : `较上月减少 ¥${Math.abs(balance).toLocaleString()}`;
    }

    const incomeValue = statCards[1].querySelector('.stat-value');
    if (incomeValue) {
      incomeValue.textContent = `¥${income.toLocaleString()}`;
    }

    const expenseValue = statCards[2].querySelector('.stat-value');
    if (expenseValue) {
      expenseValue.textContent = `¥${expense.toLocaleString()}`;
    }
  },

  async renderTrendChart() {
    const chartContainer = document.querySelector('#page-home .chart-placeholder');
    if (!chartContainer) return;

    chartContainer.innerHTML = '<div id="trend-chart" style="width: 100%; height: 250px;"></div>';

    const now = new Date();
    const year = now.getFullYear();
    const yearlyStats = await window.db.getYearlyStats(year.toString());

    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 1; i <= 12; i++) {
      const month = `${year}-${i.toString().padStart(2, '0')}`;
      months.push(`${i}月`);
      incomeData.push(yearlyStats[month]?.income || 0);
      expenseData.push(yearlyStats[month]?.expense || 0);
    }

    if (typeof ApexCharts !== 'undefined') {
      if (this.trendChart) {
        this.trendChart.destroy();
      }

      const options = {
        series: [
          {
            name: '收入',
            data: incomeData,
            color: '#10b981'
          },
          {
            name: '支出',
            data: expenseData,
            color: '#ef4444'
          }
        ],
        chart: {
          type: 'area',
          height: 250,
          background: 'transparent',
          toolbar: {
            show: false
          },
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        theme: {
          mode: 'dark'
        },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 90, 100]
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: months,
          labels: {
            style: {
              colors: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px'
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px'
            },
            formatter: (value) => '¥' + (value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value)
          }
        },
        grid: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          strokeDashArray: 4
        },
        legend: {
          show: false
        },
        tooltip: {
          theme: 'dark',
          y: {
            formatter: (value) => '¥' + value.toLocaleString()
          }
        }
      };

      this.trendChart = new ApexCharts(document.querySelector('#trend-chart'), options);
      this.trendChart.render();
    } else {
      this.renderFallbackChart(chartContainer, months, incomeData, expenseData);
    }
  },

  renderFallbackChart(container, months, incomeData, expenseData) {
    const maxValue = Math.max(...incomeData, ...expenseData, 1);
    
    let barsHtml = '<div class="chart-bars">';
    months.forEach((month, i) => {
      const incomeHeight = (incomeData[i] / maxValue) * 100;
      const expenseHeight = (expenseData[i] / maxValue) * 100;
      
      barsHtml += `
        <div class="chart-bar-group">
          <div class="chart-bar-container">
            <div class="chart-bar income" style="height: ${incomeHeight}%;" title="收入: ¥${incomeData[i]}"></div>
            <div class="chart-bar expense" style="height: ${expenseHeight}%;" title="支出: ¥${expenseData[i]}"></div>
          </div>
          <span class="chart-label">${month}</span>
        </div>
      `;
    });
    barsHtml += '</div>';

    container.innerHTML = `
      <style>
        .chart-bars { display: flex; align-items: flex-end; justify-content: space-between; height: 200px; padding: 20px 0; }
        .chart-bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; }
        .chart-bar-container { display: flex; gap: 4px; align-items: flex-end; height: 160px; }
        .chart-bar { width: 12px; border-radius: 4px 4px 0 0; transition: height 0.3s ease; }
        .chart-bar.income { background: linear-gradient(180deg, #10b981 0%, #059669 100%); }
        .chart-bar.expense { background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%); }
        .chart-label { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 8px; }
      </style>
      ${barsHtml}
    `;
  },

  renderCategoryList() {
    const categoryList = document.querySelector('#page-home .category-list');
    if (!categoryList) return;

    const categoryStats = Object.values(this.stats.categoryStats);
    categoryStats.sort((a, b) => b.amount - a.amount);

    const maxAmount = categoryStats.length > 0 ? categoryStats[0].amount : 1;

    if (categoryStats.length === 0) {
      categoryList.innerHTML = `
        <div class="empty-state" style="padding: 30px;">
          <p>暂无支出数据</p>
        </div>
      `;
      return;
    }

    let html = '';
    categoryStats.slice(0, 4).forEach(stat => {
      const percentage = (stat.amount / maxAmount) * 100;
      
      let category = null;
      if (window.categoryModule) {
        const allCategories = [...window.categoryModule.categories.expense, ...window.categoryModule.categories.income];
        category = allCategories.find(c => c.id === stat.categoryId);
      }

      const icon = category?.icon || 'circle';
      const color = category?.color || '#6b7280';

      html += `
        <div class="category-item">
          <div class="category-icon" style="background: ${color}20;">
            <i data-lucide="${icon}" class="icon" style="width: 20px; height: 20px; color: ${color};"></i>
          </div>
          <div class="category-info">
            <h4>${stat.categoryName}</h4>
            <div class="category-bar">
              <div class="category-bar-fill" style="width: ${percentage}%; background: linear-gradient(90deg, ${color} 0%, ${color}99 100%);"></div>
            </div>
          </div>
          <div class="category-amount">¥${stat.amount.toLocaleString()}</div>
        </div>
      `;
    });

    categoryList.innerHTML = html;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  },

  async renderSavingsGoal() {
    const savingsCard = document.querySelector('.savings-card');
    if (!savingsCard) return;

    const savingsGoal = await window.db.getSetting('savingsGoal');
    const monthlyGoal = savingsGoal?.monthly || 10000;
    const currentSavings = this.stats.balance;
    const percentage = Math.min((currentSavings / monthlyGoal) * 100, 100);

    const savingsValue = savingsCard.querySelector('.savings-value');
    const savingsBarFill = savingsCard.querySelector('.savings-bar-fill');
    const savingsChange = savingsCard.querySelector('.savings-change span');

    if (savingsValue) {
      savingsValue.textContent = `¥${monthlyGoal.toLocaleString()}`;
    }
    if (savingsBarFill) {
      savingsBarFill.style.width = `${percentage}%`;
    }
    if (savingsChange) {
      savingsChange.textContent = currentSavings >= 0 
        ? `已完成 ${percentage.toFixed(1)}%` 
        : `超出预算 ¥${Math.abs(currentSavings).toLocaleString()}`;
    }
  },

  async refresh() {
    await this.loadData();
    this.render();
  }
};

window.homeModule = homeModule;
