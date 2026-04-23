# 📤 上傳到 GitHub - 完整步驟

## ✅ 前置準備

你需要：
1. GitHub 帳號（免費註冊：https://github.com/signup）
2. Git 已安裝（https://git-scm.com/downloads）

---

## 📋 步驟 1：在 GitHub 創建新 Repository

### 1.1 登入 GitHub
- 訪問 https://github.com
- 用你的帳號登入

### 1.2 創建新 Repository
- 點擊右上角頭像 → **Settings**
- 或直接訪問 https://github.com/new
- 或點擊 **「+」** 圖標 → **New repository**

### 1.3 填寫信息
```
Repository name: portfolio-dashboard
Description: 美股資產管理儀表板 - 完整版本
Visibility: Public （或 Private）
```

**重要：不勾選任何選項**（Initialize with README、.gitignore、license）

### 1.4 創建
點擊 **「Create repository」**

---

## 🖥️ 步驟 2：本地上傳

### 2.1 打開終端/命令提示字元

**Windows:**
- 在 `portfolio-dashboard` 資料夾空白處右鍵
- 選擇 **Git Bash Here** 或 **Open PowerShell window here**

**Mac/Linux:**
- 打開終端機
- 用 `cd` 進入資料夾：
  ```bash
  cd /path/to/portfolio-dashboard
  ```

### 2.2 執行以下指令

**複製下面的指令，逐行執行：**

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit: Portfolio Dashboard v1.0"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR_USERNAME/portfolio-dashboard.git
```

**（將 `YOUR_USERNAME` 替換成你的 GitHub 用戶名）**

```bash
git push -u origin main
```

---

## 🔐 步驟 3：如果要求輸入密碼

### 不能直接用密碼！需要用 Token

#### 3.1 創建 Personal Access Token

1. 訪問 https://github.com/settings/tokens
2. 點擊 **Generate new token** → **Generate new token (classic)**
3. 設置：
   - **Note**: `portfolio-dashboard`
   - **Expiration**: 選擇 **90 days** 或 **No expiration**
   - **Scopes**: 勾選 ✅ `repo` 和 ✅ `workflow`
4. 滾動到底部，點擊 **Generate token**
5. **複製這個 token**（頁面只顯示一次！）

#### 3.2 使用 Token

當終端要求輸入密碼時：
- **用戶名**：輸入你的 GitHub 用戶名
- **密碼**：粘貼剛才複製的 token

---

## ✨ 步驟 4：驗證完成

1. 刷新 GitHub 頁面
2. 應該看到所有文件已上傳 ✅

```
https://github.com/YOUR_USERNAME/portfolio-dashboard
```

---

## 🎯 快速參考

### 三行核心指令

```bash
git init
git add .
git commit -m "Initial commit"
```

### 推送到 GitHub

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portfolio-dashboard.git
git push -u origin main
```

---

## 🆘 常見問題

### Q: 找不到 Git？
A: 確認已安裝 Git（https://git-scm.com/downloads）

### Q: 要求輸入密碼失敗？
A: 使用 Personal Access Token 而不是密碼（見步驟 3）

### Q: "fatal: origin already exists"？
A: 執行：
```bash
git remote remove origin
```
然後重新執行 `git remote add origin ...`

### Q: 看不到上傳的文件？
A: 
1. 確認 `git push` 完成（無錯誤信息）
2. 刷新 GitHub 頁面
3. 檢查分支是否是 **main**

### Q: 想更新代碼？
A: 修改後執行：
```bash
git add .
git commit -m "Update: 描述你的改動"
git push
```

---

## 📱 之後的工作流程

每次修改代碼後：

```bash
# 1. 查看修改
git status

# 2. 添加所有修改
git add .

# 3. 提交（寫上描述）
git commit -m "修改說明"

# 4. 推送到 GitHub
git push
```

---

## 🚀 下一步：部署到 Vercel（可選）

上傳到 GitHub 後，可以自動部署到 Vercel：

1. 訪問 https://vercel.com
2. 用 GitHub 帳號登入
3. 點擊 **New Project**
4. 選擇 `portfolio-dashboard` repo
5. 點擊 **Deploy**

✅ 完成！你會得到一個 URL 可以在線訪問

---

## 📞 需要幫助？

- GitHub 官方文檔：https://docs.github.com
- Git 教程：https://git-scm.com/book/zh-tw
- Vercel 文檔：https://vercel.com/docs

---

**準備好了嗎？開始上傳吧！🚀**
