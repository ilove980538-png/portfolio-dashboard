# GitHub 上傳 - 最簡單版本

## ⚡ 只需 8 步！

### 步驟 1-3：準備 GitHub Repository

1. 訪問 https://github.com/new
2. Repository name 輸入：`portfolio-dashboard`
3. 點擊 **Create repository**（不勾選任何選項）

✅ 完成！你會看到一個空的 repository 頁面

---

### 步驟 4-8：上傳文件

在 `portfolio-dashboard` 資料夾中打開終端，執行以下指令：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用戶名/portfolio-dashboard.git
git push -u origin main
```

**就這樣！** ✅

---

## 🔑 如果要求輸入密碼

❌ **不能用 GitHub 密碼！**

✅ **要用 Personal Access Token：**

1. 訪問 https://github.com/settings/tokens
2. 點擊 **Generate new token (classic)**
3. 勾選 ✅ `repo` 和 ✅ `workflow`
4. 點擊 **Generate token**
5. 複製 token
6. 當終端要求密碼時，粘貼 token

---

## ✨ 完成！

訪問：`https://github.com/你的用戶名/portfolio-dashboard`

你會看到所有文件已上傳！

---

## 📝 常見錯誤

| 錯誤 | 解決方案 |
|------|--------|
| "fatal: origin already exists" | `git remote remove origin` 再試一次 |
| 要求密碼失敗 | 使用 Token（見上面步驟） |
| "git: command not found" | 安裝 Git：https://git-scm.com |
| 看不到文件 | 刷新頁面或檢查分支是否是 `main` |

---

## 🎉 成功！

現在你的代碼在 GitHub 上了！

### 想要在線訪問？

1. 訪問 https://vercel.com
2. 用 GitHub 登入
3. 選擇 `portfolio-dashboard`
4. 點擊 **Deploy**

3 分鐘後你會有一個在線 URL！

---

**就這樣！祝你成功！🚀**
