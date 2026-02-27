const aiModule = {
  stats: null,
  healthScore: 0,
  insights: '',
  trendChart: null,
  predictionChart: null,
  isLoading: false,
  config: null,
  
  async init() {
    await this.loadConfig();
    await this.loadData();
    this.bindEvents();
    this.render();
    await this.analyze();
  },

  async loadConfig() {
    if (window.appConfig?.ai) {
      this.config = window.appConfig;
    } else if (window.electronAPI?.getConfig) {
      this.config = await window.electronAPI.getConfig();
    } else {
      this.config = { ai: { apiKey: '' } };
    }
  },

  async loadData() {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    this.stats = await window.db.getMonthlyStats(currentMonth);
  },

  bindEvents() {
    const refreshBtn = document.getElementById('ai-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.handleRefresh());
    }
  },

  async handleRefresh() {
    if (this.isLoading) return;
    
    const refreshBtn = document.getElementById('ai-refresh-btn');
    const originalContent = refreshBtn?.innerHTML;
    
    try {
      this.isLoading = true;
      this.setLoadingState(true, refreshBtn);
      
      await this.loadData();
      this.render();
      await this.analyze();
      
    } catch (error) {
      console.error('刷新失败:', error);
      window.showToast('刷新失败，请重试', 'error');
    } finally {
      this.isLoading = false;
      this.setLoadingState(false, refreshBtn, originalContent);
    }
  },

  setLoadingState(loading, btn, originalContent) {
    if (!btn) return;
    
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `
        <span class="loading-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></span>
        分析中...
      `;
      btn.style.opacity = '0.7';
    } else {
      btn.disabled = false;
      btn.innerHTML = originalContent || `
        <i data-lucide="refresh-ccw" class="icon" style="width: 18px; height: 18px;"></i>
        重新分析
      `;
      btn.style.opacity = '1';
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  },

  render() {
    this.calculateHealthScore();
    this.renderHealthScore();
    this.renderMetrics();
    this.renderTrendChart();
    this.renderPredictionChart();
  },

  calculateHealthScore() {
    if (!this.stats) {
      this.healthScore = 0;
      return;
    }

    let score = 50;

    const savingsRate = this.stats.income > 0 
      ? (this.stats.balance / this.stats.income) * 100 
      : 0;

    if (savingsRate >= 30) {
      score += 20;
    } else if (savingsRate >= 20) {
      score += 15;
    } else if (savingsRate >= 10) {
      score += 10;
    } else if (savingsRate < 0) {
      score -= 10;
    }

    const expenseToIncomeRatio = this.stats.income > 0 
      ? this.stats.expense / this.stats.income 
      : 2;

    if (expenseToIncomeRatio <= 0.5) {
      score += 15;
    } else if (expenseToIncomeRatio <= 0.7) {
      score += 10;
    } else if (expenseToIncomeRatio <= 0.9) {
      score += 5;
    } else if (expenseToIncomeRatio > 1) {
      score -= 15;
    }

    const categoryCount = Object.keys(this.stats.categoryStats).length;
    if (categoryCount <= 5) {
      score += 10;
    } else if (categoryCount <= 8) {
      score += 5;
    }

    const categoryStats = Object.values(this.stats.categoryStats);
    if (categoryStats.length > 0) {
      const maxCategory = Math.max(...categoryStats.map(s => s.amount));
      const maxCategoryRatio = this.stats.expense > 0 ? maxCategory / this.stats.expense : 0;
      
      if (maxCategoryRatio > 0.5) {
        score -= 10;
      } else if (maxCategoryRatio > 0.4) {
        score -= 5;
      }
    }

    this.healthScore = Math.max(0, Math.min(100, score));
  },

  renderHealthScore() {
    const scoreValue = document.getElementById('ai-score');
    const scoreProgress = document.getElementById('ai-score-progress');
    const aiStatus = document.getElementById('ai-status');

    if (scoreValue) {
      this.animateNumber(scoreValue, Math.round(this.healthScore));
    }

    if (scoreProgress) {
      const angle = (this.healthScore / 100) * 360;
      const color = this.healthScore >= 80 ? '#10b981' : 
                   this.healthScore >= 60 ? '#f59e0b' : '#ef4444';
      scoreProgress.style.background = `conic-gradient(${color} 0deg ${angle}deg, transparent ${angle}deg 360deg)`;
    }

    if (aiStatus) {
      if (this.healthScore >= 80) {
        aiStatus.textContent = '财务状况优秀';
      } else if (this.healthScore >= 60) {
        aiStatus.textContent = '财务状况良好';
      } else if (this.healthScore >= 40) {
        aiStatus.textContent = '财务状况一般';
      } else {
        aiStatus.textContent = '财务状况需要关注';
      }
    }
  },

  animateNumber(element, targetValue) {
    const startValue = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (targetValue - startValue) * easeProgress);
      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  },

  renderMetrics() {
    const savingsRateEl = document.getElementById('ai-savings-rate');
    const incomeExpenseRatioEl = document.getElementById('ai-income-expense-ratio');
    const budgetUsageEl = document.getElementById('ai-budget-usage');

    const savingsRate = this.stats.income > 0 
      ? ((this.stats.balance / this.stats.income) * 100).toFixed(1) 
      : '0.0';
    
    const expenseRatio = this.stats.income > 0 
      ? (this.stats.expense / this.stats.income).toFixed(2) 
      : '0.00';

    const categoryCount = Object.keys(this.stats.categoryStats).length;

    if (savingsRateEl) savingsRateEl.textContent = `${savingsRate}%`;
    if (incomeExpenseRatioEl) incomeExpenseRatioEl.textContent = `1:${expenseRatio}`;
    if (budgetUsageEl) budgetUsageEl.textContent = `${categoryCount}个`;
  },

  async renderTrendChart() {
    const chartContainer = document.getElementById('ai-monthly-chart');
    if (!chartContainer) return;

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
            color: '#667eea'
          }
        ],
        chart: {
          type: 'area',
          height: 300,
          background: 'transparent',
          toolbar: { show: false },
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
          }
        },
        theme: { mode: 'dark' },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1
          }
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: months,
          labels: {
            style: { colors: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            style: { colors: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' },
            formatter: (value) => '¥' + (value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value)
          }
        },
        grid: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          strokeDashArray: 4
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          labels: { colors: 'rgba(255, 255, 255, 0.6)' }
        },
        tooltip: {
          theme: 'dark',
          y: { formatter: (value) => '¥' + value.toLocaleString() }
        }
      };

      this.trendChart = new ApexCharts(chartContainer, options);
      this.trendChart.render();
    }
  },

  async renderPredictionChart() {
    const chartContainer = document.getElementById('ai-prediction-chart');
    if (!chartContainer) return;

    const now = new Date();
    const year = now.getFullYear();
    const yearlyStats = await window.db.getYearlyStats(year.toString());

    const months = [];
    const actualData = [];
    const predictedData = [];

    const currentMonth = now.getMonth() + 1;

    for (let i = 1; i <= 12; i++) {
      months.push(`${i}月`);
      
      if (i <= currentMonth) {
        actualData.push(yearlyStats[`${year}-${i.toString().padStart(2, '0')}`]?.expense || 0);
        predictedData.push(null);
      } else {
        actualData.push(null);
        if (i === currentMonth + 1) {
          const avgExpense = this.calculateAverageExpense(yearlyStats, currentMonth);
          predictedData.push(avgExpense);
        } else {
          predictedData.push(null);
        }
      }
    }

    if (typeof ApexCharts !== 'undefined') {
      if (this.predictionChart) {
        this.predictionChart.destroy();
      }

      const options = {
        series: [
          {
            name: '实际支出',
            data: actualData,
            color: '#667eea'
          },
          {
            name: '预测支出',
            data: predictedData,
            color: '#f59e0b'
          }
        ],
        chart: {
          type: 'bar',
          height: 250,
          background: 'transparent',
          toolbar: { show: false },
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
          }
        },
        theme: { mode: 'dark' },
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '60%'
          }
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: months,
          labels: {
            style: { colors: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            style: { colors: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' },
            formatter: (value) => value ? '¥' + (value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value) : ''
          }
        },
        grid: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          strokeDashArray: 4
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          labels: { colors: 'rgba(255, 255, 255, 0.6)' }
        },
        tooltip: {
          theme: 'dark',
          y: { formatter: (value) => value ? '¥' + value.toLocaleString() : '-' }
        }
      };

      this.predictionChart = new ApexCharts(chartContainer, options);
      this.predictionChart.render();
    }
  },

  calculateAverageExpense(yearlyStats, currentMonth) {
    let total = 0;
    let count = 0;
    
    for (let i = 1; i <= currentMonth; i++) {
      const month = `${new Date().getFullYear()}-${i.toString().padStart(2, '0')}`;
      if (yearlyStats[month]?.expense > 0) {
        total += yearlyStats[month].expense;
        count++;
      }
    }
    
    return count > 0 ? Math.round(total / count) : 0;
  },

  async analyze() {
    const insightsContainer = document.getElementById('ai-insight-text');
    if (!insightsContainer) return;

    insightsContainer.innerHTML = '<span class="loading-spinner" style="margin-right: 8px;"></span> AI正在分析您的财务数据...';

    try {
      const prompt = this.buildAnalysisPrompt();
      const response = await this.callAI(prompt);
      
      if (response) {
        insightsContainer.textContent = response;
        this.insights = response;
      } else {
        this.generateLocalInsights(insightsContainer);
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      this.generateLocalInsights(insightsContainer);
    }
  },

  buildAnalysisPrompt() {
    const categoryStats = Object.values(this.stats.categoryStats);
    const topCategories = categoryStats
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map(c => `${c.categoryName}(¥${c.amount.toLocaleString()})`)
      .join('、');

    return `请分析以下财务数据并给出建议（100字以内）：
- 本月收入：¥${this.stats.income.toLocaleString()}
- 本月支出：¥${this.stats.expense.toLocaleString()}
- 本月结余：¥${this.stats.balance.toLocaleString()}
- 支出前三分类：${topCategories || '无'}
- 储蓄率：${this.stats.income > 0 ? ((this.stats.balance / this.stats.income) * 100).toFixed(1) : 0}%
- 财务健康度：${Math.round(this.healthScore)}分

请给出简洁的财务建议。`;
  },

  async callAI(prompt) {
    const apiUrl = this.config?.ai?.apiUrl;
    const apiKey = this.config?.ai?.apiKey;
    const model = this.config?.ai?.model;
    const maxTokens = this.config?.ai?.maxTokens || 200;
    const temperature = this.config?.ai?.temperature || 0.7;

    if (!apiKey || !apiUrl || !model) {
      return null;
    }

    const messages = [
      {
        role: 'system',
        content: '你是一位专业的财务顾问，请用简洁的中文给出财务建议。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      let data;
      
      if (window.electronAPI?.aiChat) {
        data = await window.electronAPI.aiChat({
          apiUrl,
          apiKey,
          model,
          messages,
          maxTokens,
          temperature
        });
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            enable_thinking: false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return null;
        }

        data = await response.json();
      }
      
      if (data.error) {
        return null;
      }
      
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      return null;
    }
  },

  generateLocalInsights(container) {
    let insights = [];

    const savingsRate = this.stats.income > 0 
      ? (this.stats.balance / this.stats.income) * 100 
      : 0;

    if (savingsRate >= 30) {
      insights.push('储蓄率优秀，建议考虑增加投资比例');
    } else if (savingsRate >= 20) {
      insights.push('储蓄率良好，继续保持');
    } else if (savingsRate >= 10) {
      insights.push('储蓄率一般，建议适当控制支出');
    } else if (savingsRate < 0) {
      insights.push('本月支出超过收入，需要注意控制消费');
    }

    const categoryStats = Object.values(this.stats.categoryStats);
    if (categoryStats.length > 0) {
      const topCategory = categoryStats.sort((a, b) => b.amount - a.amount)[0];
      const topCategoryRatio = this.stats.expense > 0 
        ? (topCategory.amount / this.stats.expense) * 100 
        : 0;
      
      if (topCategoryRatio > 40) {
        insights.push(`"${topCategory.categoryName}"支出占比较高(${topCategoryRatio.toFixed(0)}%)，可考虑优化`);
      }
    }

    if (this.healthScore >= 80) {
      insights.push('财务状况非常健康，继续保持良好习惯');
    } else if (this.healthScore >= 60) {
      insights.push('财务状况良好，有改进空间');
    } else {
      insights.push('财务状况需要关注，建议制定预算计划');
    }

    container.textContent = insights.join('。') + '。';
  },

  async refresh() {
    await this.loadData();
    this.render();
  }
};

window.aiModule = aiModule;
