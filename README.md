# 记账助手

一款运行于 Windows 平台的桌面端个人财务管理应用，帮助用户轻松记录日常收支、管理财务分类、分析消费习惯，实现科学理财。

## 功能特性

### 首页 - 财务概览

- 账户余额展示：实时显示本月收支结余情况
- 本月收支统计：清晰展示本月收入和支出总额
- 收支趋势图表：以折线图形式展示全年各月收支变化趋势
- 支出分类排行：展示本月主要支出分类及金额占比
- 储蓄目标进度：显示本月储蓄目标的完成进度

### 账单管理

- 账单列表：分页展示所有账单记录，支持按日期或金额排序
- 账单筛选：支持按类型（全部/收入/支出）筛选账单
- 账单搜索：支持按分类名称、备注、子分类关键词搜索
- 添加/编辑/删除账单：完整的账单 CRUD 操作

### 分类管理

- 分类列表：分别展示支出分类和收入分类
- 自定义分类：支持创建、编辑、删除分类
- 子分类支持：可选的细分项目列表
- 预设分类：餐饮、住房、交通、购物、娱乐、医疗、教育等

### AI 智能分析

- 财务健康度评分：综合评估用户财务状况（0-100分）
- 关键指标展示：储蓄率、收支比、预算使用率
- 月度趋势图表：展示全年各月收支变化
- 消费预测图表：基于历史数据预测下月支出
- AI 智能建议：根据财务数据生成个性化理财建议

### 设置中心

- 个人信息：用户名、货币单位、月度储蓄目标、头像设置
- 预算设置：月度预算、超支警告、警告阈值
- 通知设置：每日记账提醒、周报推送、预算超支警告
- 外观主题：深色模式、浅色模式、紫色主题、跟随系统
- 数据管理：导出数据、导入数据、清除数据

## 技术栈

- **Electron v28** - 跨平台桌面应用框架
- **IndexedDB** - 浏览器本地数据库存储
- **原生 HTML/CSS/JavaScript** - 前端技术
- **Lucide Icons** - 图标库
- **dotenv** - 环境变量管理

## 系统要求

- 操作系统：Windows 10 及以上
- 架构支持：32位（x86）和 64位（x64）

## 快速开始

### 环境配置

1. 复制环境变量示例文件：

```bash
cp .env.example .env
```

1. 编辑 `.env` 文件，配置 AI API（可选）：

```env
# API配置 - 请填入您的实际API密钥
AI_API_KEY=your-api-key-here

# API地址（推荐使用魔塔社区ModelScope）
AI_API_URL=your-api-url-here

# 模型名称
AI_MODEL=your-model-name-here

```

### 安装与运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产模式运行
npm start
```

### 打包构建

```bash
# 构建 Windows 安装包（自动检测架构）
npm run build

# 构建 32 位版本
npm run build:32

# 构建 64 位版本
npm run build:64

# 构建所有架构
npm run build:all
```

## 项目结构

```
记账助手/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本（IPC 通信桥接）
├── config.js            # 应用配置
├── index.html           # 主页面入口
├── package.json         # 项目配置
├── .env.example         # 环境变量示例
├── assets/
│   └── icons/           # 应用图标
├── css/
│   ├── common.css       # 公共样式
│   ├── sidebar.css      # 侧边栏样式
│   ├── main-content.css # 主内容区样式
│   ├── home.css         # 首页样式
│   ├── bills.css        # 账单页样式
│   ├── categories.css   # 分类页样式
│   ├── ai.css           # AI分析页样式
│   └── settings.css     # 设置页样式
├── js/
│   ├── app.js           # 应用主模块
│   ├── database.js      # IndexedDB 数据库模块
│   ├── home.js          # 首页模块
│   ├── bills.js         # 账单模块
│   ├── categories.js    # 分类模块
│   ├── ai.js            # AI分析模块
│   ├── settings.js      # 设置模块
│   └── modal.js         # 弹窗模块
├── UI/                  # 界面截图
└── dist/                # 打包输出目录
```

## 数据存储

应用使用 IndexedDB 进行本地数据存储，包含以下数据表：

| 表名         | 说明   | 主要字段                                                   |
| ---------- | ---- | ------------------------------------------------------ |
| bills      | 账单记录 | id, type, amount, categoryId, date, month, description |
| categories | 分类信息 | id, name, icon, color, type, subcategories             |
| settings   | 应用设置 | key, value, updatedAt                                  |

## AI 功能配置

AI 分析功能支持兼容 OpenAI API 格式的服务。

配置方式：

1. 复制 `.env.example` 为 `.env`
2. 填入你的 API Key、API URL 和模型名称

示例：

```env
# API配置 - 请填入您的实际API密钥
AI_API_KEY=sk-xxxxxxxxxxxxxxxx

# API地址
AI_API_URL=https://api.deepseek.com/v1/chat/completions

# 模型名称
AI_MODEL=deepseek-chat
```

**DeepSeek 注册与使用步骤：**

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/) 并注册账号
2. 登录后，点击右上角头像 → API Keys
3. 点击「创建 API Key」按钮，生成新的 API Key
4. 复制 API Key 后妥善保存，页面关闭后无法再次查看
5. 在账户中心充值额度
6. 将 API Key 填入 `.env` 文件的 `AI_API_KEY`
7. 在 DeepSeek 平台 [API 文档](https://platform.deepseek.com/api-docs/) 查看支持的模型

*注意：可以使用魔塔社区免费模型*

```env
# API配置 - 请填入您的实际API密钥
AI_API_KEY=ms-xxxxxxxxxxxxxxxx

# API地址
AI_API_URL=https://api-inference.modelscope.cn/v1/chat/completions

# 模型名称
AI_MODEL=XiaomiMiMo/MiMo-V2-Flash（可使用其他支持的文本生成模型）

```

**魔塔社区注册与使用步骤：**

1. 访问 [魔塔社区](https://www.modelscope.cn/) 并注册账号
2. 登录后，绑定阿里云账号并进行实名认证，点击右上角头像 → 绑定阿里云账号
3. 点击右上角头像 → 账号设置 → 访问令牌
4. 创建或复制你的 访问令牌（以 `ms-` 开头）建议：创建访问令牌——有效期选择”长期使用“
5. 将 访问令牌 填入 `.env` 文件的 `AI_API_KEY`
6. 在魔塔社区 [模型广场](https://www.modelscope.cn/models) 选择支持的文本生成模型

## 版本信息

- 当前版本：2.0.0
- 更新日期：2026年3月22日

## License

MIT
