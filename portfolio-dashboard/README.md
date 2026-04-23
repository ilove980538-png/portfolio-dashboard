# 📈 Portfolio Dashboard - 美股資產管理儀表板

一個功能完整的美股投資組合管理應用，支援雙帳戶管理、即時報價、績效分析等功能。

## ✨ 核心功能

### 🎯 投資組合管理
- ✅ **雙帳戶切換** - 分開管理「我的帳戶」和「爸爸的帳戶」
- ✅ **獨立現金管理** - 各帳戶美金餘額完全分開
- ✅ **買入/賣出** - 支援部分賣出和全數出清
- ✅ **成本追蹤** - 自動計算均價、成本基礎、損益

### 📊 實時數據
- ✅ **Finnhub API 串接** - 獲取實時美股報價
- ✅ **同步現價** - 一鍵更新持股清單報價
- ✅ **損益即時計算** - 實現和未實現損益同步更新

### 📈 績效分析
- ✅ **已平倉交易統計** - 顯示勝率、平均報酬率
- ✅ **最佳/最差交易** - 快速查看績效表現
- ✅ **詳細交易記錄** - 完整的成本、售價、手續費追蹤

### 💾 數據持久化
- ✅ **localStorage 儲存** - 刷新網頁數據不遺失
- ✅ **獨立帳戶存儲** - 我的和爸爸的數據完全分離
- ✅ **完整交易日誌** - 所有現金、買入、賣出記錄

## 🚀 快速開始

### 前置要求
- Node.js 16+ 和 npm

### 安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/你的用戶名/portfolio-dashboard.git
cd portfolio-dashboard

# 2. 安裝依賴
npm install

# 3. 啟動開發服務器
npm run dev
```

應用會自動在 `http://localhost:3000` 開啟

### 構建產品版本

```bash
npm run build
```

這會生成 `dist` 資料夾，包含所有優化後的文件。

## 📋 使用指南

### 綜合總覽
看到你的整體投資狀況：
- 我的和爸爸的美金餘額
- 持股成本和現值
- 未實現損益和已實現損益

### 我的持股 / 爸爸的持股
查看各帳戶的持股明細：
- 股票代號、股數、均價、現價
- 成本、市值、損益百分比
- 快速賣出按鈕

### 現金管理
管理美金帳戶：
- 存入或提領美金
- 查看持股佔資產的比例
- 現金操作歷史記錄

### 績效分析
檢視交易績效：
- 已平倉交易統計（勝率、平均報酬率）
- 最佳和最差交易詳情
- 完整的交易明細表

### 交易日誌
查看所有交易記錄：
- 現金存提
- 股票買入/賣出
- 時間戳和金額變動

## 🔧 配置

### API Key
應用使用 Finnhub API 獲取實時報價。

在 `.env.local` 文件中配置：
```
VITE_FINNHUB_API_KEY=你的_API_KEY
```

或直接使用預設的 Key（來自 `.env.example`）

## 📦 項目結構

```
portfolio-dashboard/
├── public/                  # 靜態資源
├── src/
│   ├── App.jsx             # 主應用組件
│   ├── main.jsx            # React 進入點
│   └── index.css           # 全局樣式
├── index.html              # HTML 模板
├── package.json            # 依賴配置
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind CSS 配置
├── postcss.config.js       # PostCSS 配置
├── .gitignore              # Git 忽略清單
├── .env.example            # 環境變數範例
└── README.md               # 本文件
```

## 🎨 設計風格

- **Premium Dark 主題** - 深色背景搭配高質感漸層
- **毛玻璃效果** - 使用 backdrop-blur 提升視覺層次
- **翡翠綠獲利 / 玫瑰紅虧損** - 直觀的損益顏色區分
- **響應式設計** - 支援各種屏幕尺寸

## 💾 數據存儲

所有數據都保存在瀏覽器的 `localStorage` 中：

```javascript
portfolio_holdings           // 持股清單
portfolio_cash_my           // 我的美金餘額
portfolio_cash_dad          // 爸爸的美金餘額
portfolio_logs_my           // 我的交易日誌
portfolio_logs_dad          // 爸爸的交易日誌
portfolio_sold_records_my   // 我的已平倉交易
portfolio_sold_records_dad  // 爸爸的已平倒交易
```

清除所有數據只需清除瀏覽器 localStorage。

## 🚀 部署

### Vercel（推薦）

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages

在 `vite.config.js` 中添加：
```javascript
export default {
  base: '/portfolio-dashboard/',
  // ... 其他配置
}
```

然後：
```bash
npm run build
# 上傳 dist 文件夾到 GitHub Pages
```

## 🔐 安全性建議

在生產環境中：

1. **不要在前端暴露 API Key** - 創建後端 API 代理
2. **使用環境變數** - 將敏感信息存在 `.env.local` 中
3. **驗證數據** - 在提交買賣交易前驗證用戶輸入
4. **定期備份** - 導出你的投資數據

## 📝 功能清單

- [x] 雙帳戶管理
- [x] 買入/賣出股票
- [x] 現金存提
- [x] 實時報價更新
- [x] 損益計算
- [x] 績效分析
- [x] 交易日誌
- [x] localStorage 持久化
- [ ] 數據匯出（CSV/Excel）
- [ ] 圖表展示
- [ ] 稅務報告
- [ ] 組合分析

## 🤝 貢獻

歡迎提出 Issues 和 Pull Requests！

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 文件

## 💬 聯絡

如有問題或建議，歡迎提出 Issue。

---

**Made with ❤️ by 謝東錡**

最後更新：2026年4月23日
