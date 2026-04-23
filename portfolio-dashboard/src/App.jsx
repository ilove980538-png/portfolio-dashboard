import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  LogOut,
  BarChart3,
  Calendar,
  RefreshCw,
  ChevronDown,
  X,
  DollarSign,
  PieChart,
} from 'lucide-react';

// ==================== 資料持久化工具 ====================
const STORAGE_KEYS = {
  HOLDINGS: 'portfolio_holdings',
  CASH_MY: 'portfolio_cash_my',
  CASH_DAD: 'portfolio_cash_dad',
  LOGS_MY: 'portfolio_logs_my',
  LOGS_DAD: 'portfolio_logs_dad',
  SOLD_RECORDS_MY: 'portfolio_sold_records_my',
  SOLD_RECORDS_DAD: 'portfolio_sold_records_dad',
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error(`讀取 ${key} 失敗`, e);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`儲存 ${key} 失敗`, e);
  }
};

// ==================== Modal - 買入（獨立元件）====================
function BuyModal({ show, onClose, onConfirm }) {
  const symbolRef = React.useRef();
  const priceRef = React.useRef();
  const quantityRef = React.useRef();
  const feeRef = React.useRef();
  const accountRef = React.useRef();

  const handleConfirm = () => {
    onConfirm({
      symbol: symbolRef.current?.value || '',
      price: priceRef.current?.value || '',
      quantity: quantityRef.current?.value || '',
      fee: feeRef.current?.value || '0.99',
      account: accountRef.current?.value || 'my',
    });
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-gray-900/95 border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">買入股票</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">股票代號</label>
            <input
              ref={symbolRef}
              type="text"
              placeholder="例: TSLA"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50"
              style={{textTransform:'uppercase'}}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">買入價格</label>
              <input
                ref={priceRef}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">股數</label>
              <input
                ref={quantityRef}
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">手續費</label>
            <input
              ref={feeRef}
              type="text"
              inputMode="decimal"
              placeholder="0.99"
              defaultValue="0.99"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">帳戶</label>
            <select
              ref={accountRef}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-400/50"
            >
              <option value="my">我的帳戶</option>
              <option value="dad">爸爸的帳戶</option>
            </select>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full mt-6 bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all"
          >
            確認買入
          </button>
        </div>
      </div>
    </div>
  );
}

function SellModal({ show, selectedStock, onClose, onConfirm }) {
  const quantityRef = React.useRef();
  const salePriceRef = React.useRef();
  const feeRef = React.useRef();
  const [saleType, setSaleType] = React.useState('partial');

  const handleConfirm = () => {
    onConfirm({
      saleType,
      quantity: saleType === 'all' ? selectedStock?.quantity?.toString() : (quantityRef.current?.value || ''),
      salePrice: salePriceRef.current?.value || '',
      fee: feeRef.current?.value || '0.99',
    });
  };

  if (!show || !selectedStock) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-gray-900/95 border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">賣出 {selectedStock.symbol}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-gray-400 text-sm">持股數量</p>
            <p className="text-2xl font-bold text-white">
              {selectedStock.quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">賣出方式</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="all" checked={saleType === 'all'} onChange={() => setSaleType('all')} className="w-4 h-4" />
                <span className="text-gray-300">全數出清</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="partial" checked={saleType === 'partial'} onChange={() => setSaleType('partial')} className="w-4 h-4" />
                <span className="text-gray-300">部分賣出</span>
              </label>
            </div>
          </div>
          {saleType === 'partial' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">賣出股數</label>
              <input
                ref={quantityRef}
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400/50"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">成交價</label>
              <input
                ref={salePriceRef}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">賣出手續費</label>
              <input
                ref={feeRef}
                type="text"
                inputMode="decimal"
                placeholder="0.99"
                defaultValue="0.99"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400/50"
              />
            </div>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full mt-6 bg-rose-500/80 hover:bg-rose-500 text-white font-bold py-3 rounded-lg transition-all"
          >
            確認賣出
          </button>
        </div>
      </div>
    </div>
  );
}

function CashModal({ show, onClose, onConfirm }) {
  const amountRef = React.useRef();
  const remarkRef = React.useRef();
  const [account, setAccount] = React.useState('my');
  const [type, setType] = React.useState('deposit');

  const handleConfirm = () => {
    onConfirm({
      account,
      type,
      amount: amountRef.current?.value || '',
      remark: remarkRef.current?.value || '',
    });
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-gray-900/95 border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">現金操作</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">帳戶</label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400/50"
            >
              <option value="my">我的帳戶</option>
              <option value="dad">爸爸的帳戶</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">操作類型</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="deposit" checked={type === 'deposit'} onChange={() => setType('deposit')} className="w-4 h-4" />
                <span className="text-gray-300">存入</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="withdraw" checked={type === 'withdraw'} onChange={() => setType('withdraw')} className="w-4 h-4" />
                <span className="text-gray-300">提領</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">金額</label>
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">備註</label>
            <input
              ref={remarkRef}
              type="text"
              placeholder="選填"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
            />
          </div>
          <button
            onClick={handleConfirm}
            className="w-full mt-6 bg-blue-500/80 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );
}


export default function PortfolioDashboard() {
  // 狀態管理
  const [holdings, setHoldings] = useState([]);
  const [cashBalanceMy, setCashBalanceMy] = useState(0);
  const [cashBalanceDad, setCashBalanceDad] = useState(0);
  const [logsMy, setLogsMy] = useState([]);
  const [logsDad, setLogsDad] = useState([]);
  const [soldRecordsMy, setSoldRecordsMy] = useState([]);
  const [soldRecordsDad, setSoldRecordsDad] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [loading, setLoading] = useState(false);

  // Modal 狀態
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // 表單狀態
  const [buyForm, setBuyForm] = useState({
    symbol: '',
    price: '',
    quantity: '',
    fee: '',
    account: 'my',
  });

  const [sellForm, setSellForm] = useState({
    quantity: '',
    salePrice: '',
    fee: '',
    saleType: 'partial',
  });

  const [cashForm, setCashForm] = useState({
    type: 'deposit',
    amount: '',
    remark: '',
    account: 'my',
  });

  // 從 localStorage 載入初始數據
  useEffect(() => {
    const savedHoldings = loadFromStorage(STORAGE_KEYS.HOLDINGS, []);
    const savedCashMy = loadFromStorage(STORAGE_KEYS.CASH_MY, 100000);
    const savedCashDad = loadFromStorage(STORAGE_KEYS.CASH_DAD, 100000);
    const savedLogsMy = loadFromStorage(STORAGE_KEYS.LOGS_MY, []);
    const savedLogsDad = loadFromStorage(STORAGE_KEYS.LOGS_DAD, []);
    const savedSoldRecordsMy = loadFromStorage(STORAGE_KEYS.SOLD_RECORDS_MY, []);
    const savedSoldRecordsDad = loadFromStorage(STORAGE_KEYS.SOLD_RECORDS_DAD, []);

    setHoldings(savedHoldings);
    setCashBalanceMy(savedCashMy);
    setCashBalanceDad(savedCashDad);
    setLogsMy(savedLogsMy);
    setLogsDad(savedLogsDad);
    setSoldRecordsMy(savedSoldRecordsMy);
    setSoldRecordsDad(savedSoldRecordsDad);
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HOLDINGS, holdings);
  }, [holdings]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CASH_MY, cashBalanceMy);
  }, [cashBalanceMy]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CASH_DAD, cashBalanceDad);
  }, [cashBalanceDad]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.LOGS_MY, logsMy);
  }, [logsMy]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.LOGS_DAD, logsDad);
  }, [logsDad]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SOLD_RECORDS_MY, soldRecordsMy);
  }, [soldRecordsMy]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SOLD_RECORDS_DAD, soldRecordsDad);
  }, [soldRecordsDad]);

  // ==================== 業務邏輯函數 ====================

  // 同步現價 - 使用 Finnhub API
  const syncPrices = useCallback(async () => {
    if (holdings.length === 0) return;

    setLoading(true);
    const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'd7j38fpr01qp3g1rkso0d7j38fpr01qp3g1rksog';
    const updatedHoldings = [...holdings];

    for (const holding of updatedHoldings) {
      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${holding.symbol}&token=${API_KEY}`
        );
        const data = await response.json();
        if (data.c !== undefined) {
          holding.currentPrice = data.c;
        }
      } catch (error) {
        console.error(`無法獲取 ${holding.symbol} 的價格`, error);
      }
    }

    setHoldings(updatedHoldings);
    setLoading(false);
  }, [holdings]);

  // 買入股票
  const handleBuy = (values) => {
    const { symbol, price, quantity, fee, account } = values || buyForm;

    if (!symbol || !price || !quantity) {
      alert('請填入完整的買入資訊');
      return;
    }

    const numPrice = parseFloat(price);
    const numQuantity = parseFloat(quantity);
    const numFee = parseFloat(fee) || 0;
    const totalCost = numPrice * numQuantity + numFee;

    // 檢查現金是否足夠
    const currentCash = account === 'my' ? cashBalanceMy : cashBalanceDad;
    if (currentCash < totalCost) {
      alert(`${account === 'my' ? '我的' : "爸爸的"}帳戶美金不足`);
      return;
    }

    // 找尋已有的持股
    const existingIndex = holdings.findIndex(
      (h) => h.symbol === symbol.toUpperCase() && h.account === account
    );

    if (existingIndex >= 0) {
      // 更新已有持股
      const existing = holdings[existingIndex];
      const newQuantity = existing.quantity + numQuantity;
      const newAvgCost =
        (existing.avgCost * existing.quantity + totalCost) / newQuantity;

      const updatedHoldings = [...holdings];
      updatedHoldings[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        avgCost: newAvgCost,
        currentPrice: numPrice,
      };
      setHoldings(updatedHoldings);
    } else {
      // 新增持股
      const newHolding = {
        id: Date.now(),
        symbol: symbol.toUpperCase(),
        quantity: numQuantity,
        avgCost: numPrice,
        currentPrice: numPrice,
        account: account,
      };
      setHoldings([...holdings, newHolding]);
    }

    // 扣除現金
    if (account === 'my') {
      setCashBalanceMy(cashBalanceMy - totalCost);
    } else {
      setCashBalanceDad(cashBalanceDad - totalCost);
    }

    // 記錄 Log
    const log = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('zh-TW'),
      category: '股票買入',
      details: `${symbol.toUpperCase()} ${numQuantity}股 @ ${numPrice}元`,
      amount: -totalCost,
    };

    if (account === 'my') {
      setLogsMy([...logsMy, log]);
    } else {
      setLogsDad([...logsDad, log]);
    }

    // 重置表單
    setBuyForm({
      symbol: '',
      price: '',
      quantity: '',
      fee: '',
      account: 'my',
    });
    setShowBuyModal(false);
  };

  // 開啟賣出 Modal
  const openSellModal = (stock) => {
    setSelectedStock(stock);
    setSellForm({
      quantity: stock.quantity.toString(),
      salePrice: stock.currentPrice.toString(),
      fee: '',
      saleType: 'all',
    });
    setShowSellModal(true);
  };

  // 關閉賣出 Modal
  const closeSellModal = () => {
    setShowSellModal(false);
    setSelectedStock(null);
    setSellForm({
      quantity: '',
      salePrice: '',
      fee: '',
      saleType: 'partial',
    });
  };

  // 賣出股票
  const handleSell = (values) => {
    if (!selectedStock) return;

    const { quantity, salePrice, fee, saleType } = values || sellForm;
    const numQuantity = parseFloat(quantity);
    const numSalePrice = parseFloat(salePrice);
    const numFee = parseFloat(fee) || 0;

    if (saleType === 'all' && numQuantity !== selectedStock.quantity) {
      alert('全數出清時，股數必須等於持股數量');
      return;
    }

    if (numQuantity > selectedStock.quantity) {
      alert('賣出股數不能超過持股數量');
      return;
    }

    const grossProceeds = numQuantity * numSalePrice;
    const netProceeds = grossProceeds - numFee;
    const costBasis = numQuantity * selectedStock.avgCost;
    const gainLoss = netProceeds - costBasis;
    const gainLossPercent =
      costBasis > 0 ? ((gainLoss / costBasis) * 100).toFixed(2) : 0;

    // 更新持股或刪除
    const updatedHoldings = [...holdings];
    const holdingIndex = updatedHoldings.findIndex(
      (h) => h.id === selectedStock.id
    );

    if (saleType === 'all' || numQuantity === selectedStock.quantity) {
      updatedHoldings.splice(holdingIndex, 1);
    } else {
      updatedHoldings[holdingIndex].quantity -= numQuantity;
    }

    setHoldings(updatedHoldings);

    // 增加現金
    if (selectedStock.account === 'my') {
      setCashBalanceMy(cashBalanceMy + netProceeds);
    } else {
      setCashBalanceDad(cashBalanceDad + netProceeds);
    }

    // 記錄賣出記錄（用於績效分析）
    const saleRecord = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('zh-TW'),
      symbol: selectedStock.symbol,
      quantity: numQuantity,
      avgCost: selectedStock.avgCost,
      salePrice: numSalePrice,
      costBasis: costBasis,
      grossProceeds: grossProceeds,
      fee: numFee,
      gainLoss: gainLoss,
      gainLossPercent: gainLossPercent,
      account: selectedStock.account,
    };

    if (selectedStock.account === 'my') {
      setSoldRecordsMy([...soldRecordsMy, saleRecord]);
    } else {
      setSoldRecordsDad([...soldRecordsDad, saleRecord]);
    }

    // 記錄 Log
    const log = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('zh-TW'),
      category: '股票賣出',
      details: `${selectedStock.symbol} ${numQuantity}股 @ ${numSalePrice}元`,
      amount: netProceeds,
    };

    if (selectedStock.account === 'my') {
      setLogsMy([...logsMy, log]);
    } else {
      setLogsDad([...logsDad, log]);
    }

    closeSellModal();
  };

  // 現金操作（存入/提領）
  const handleCashTransaction = (values) => {
    const { type, amount, remark, account } = values || cashForm;
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      alert('請輸入有效金額');
      return;
    }

    const transactionAmount = type === 'deposit' ? numAmount : -numAmount;

    if (account === 'my') {
      setCashBalanceMy(cashBalanceMy + transactionAmount);
    } else {
      setCashBalanceDad(cashBalanceDad + transactionAmount);
    }

    const log = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('zh-TW'),
      category: type === 'deposit' ? '存入美金' : '提領美金',
      details: remark || (type === 'deposit' ? '現金存入' : '現金提領'),
      amount: transactionAmount,
    };

    if (account === 'my') {
      setLogsMy([...logsMy, log]);
    } else {
      setLogsDad([...logsDad, log]);
    }

    setCashForm({
      type: 'deposit',
      amount: '',
      remark: '',
      account: 'my',
    });
    setShowCashModal(false);
  };

  // ==================== 計算數據 ====================

  const getFilteredHoldings = () => {
    if (selectedAccount === 'all') return holdings;
    if (selectedAccount === 'my') return holdings.filter((h) => h.account === 'my');
    if (selectedAccount === 'dad') return holdings.filter((h) => h.account === 'dad');
    return holdings;
  };

  const filteredHoldings = getFilteredHoldings();

  const calculatePortfolioMetrics = (hlds) => {
    const totalCost = hlds.reduce((sum, h) => sum + h.quantity * h.avgCost, 0);
    const totalValue = hlds.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
    const unrealizedGain = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? ((unrealizedGain / totalCost) * 100).toFixed(2) : 0;

    return {
      totalCost,
      totalValue,
      unrealizedGain,
      gainLossPercent,
    };
  };

  const overallMetrics = calculatePortfolioMetrics(holdings);
  const myMetrics = calculatePortfolioMetrics(
    holdings.filter((h) => h.account === 'my')
  );
  const dadMetrics = calculatePortfolioMetrics(
    holdings.filter((h) => h.account === 'dad')
  );

  const totalAssetsMy = cashBalanceMy + myMetrics.totalValue;
  const totalAssetsDad = cashBalanceDad + dadMetrics.totalValue;
  const totalAssets = totalAssetsMy + totalAssetsDad;

  // ==================== 績效分析數據 ====================

  const getPerformanceStats = (soldRecords) => {
    return {
      totalTransactions: soldRecords.length,
      totalGain: soldRecords.reduce((sum, r) => sum + r.gainLoss, 0),
      winRate:
        soldRecords.length > 0
          ? (
              (soldRecords.filter((r) => r.gainLoss > 0).length /
                soldRecords.length) *
              100
            ).toFixed(2)
          : 0,
      avgGainPercent:
        soldRecords.length > 0
          ? (
              soldRecords.reduce((sum, r) => sum + parseFloat(r.gainLossPercent), 0) /
              soldRecords.length
            ).toFixed(2)
          : 0,
      bestTrade: soldRecords.length > 0
        ? soldRecords.reduce((best, r) =>
            parseFloat(r.gainLossPercent) > parseFloat(best.gainLossPercent) ? r : best
          )
        : null,
      worstTrade: soldRecords.length > 0
        ? soldRecords.reduce((worst, r) =>
            parseFloat(r.gainLossPercent) < parseFloat(worst.gainLossPercent) ? r : worst
          )
        : null,
    };
  };

  const performanceStatsOverall = getPerformanceStats([...soldRecordsMy, ...soldRecordsDad]);
  const performanceStatsMy = getPerformanceStats(soldRecordsMy);
  const performanceStatsDad = getPerformanceStats(soldRecordsDad);

  // ==================== 元件 - 計價卡片 ====================

  const MetricCard = ({ title, value, subtext, icon: Icon, isPositive }) => {
    const textColor = isPositive ? 'text-emerald-400' : 'text-rose-400';

    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
            <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
            {subtext && <p className="text-gray-500 text-xs mt-2">{subtext}</p>}
          </div>
          {Icon && <Icon className={`w-8 h-8 ${textColor} opacity-30`} />}
        </div>
      </div>
    );
  };

  // ==================== 元件 - 持股表格 ====================

  const HoldingsTable = ({ data }) => {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-6 py-4 text-left text-gray-400 font-semibold">代號</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">股數</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">均價</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">現價</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">成本</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">市值</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">損益</th>
                <th className="px-6 py-4 text-center text-gray-400 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    目前沒有持股
                  </td>
                </tr>
              ) : (
                data.map((holding) => {
                  const cost = holding.quantity * holding.avgCost;
                  const value = holding.quantity * holding.currentPrice;
                  const gain = value - cost;
                  const gainPercent = cost > 0 ? ((gain / cost) * 100).toFixed(2) : 0;
                  const isGain = gain >= 0;

                  return (
                    <tr
                      key={holding.id}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-white">{holding.symbol}</td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        {holding.quantity.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        ${holding.avgCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        ${holding.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        ${cost.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        ${value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          isGain ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ${gain.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ({gainPercent}%)
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openSellModal(holding)}
                          className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-medium transition-all"
                        >
                          賣出
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ==================== 頁面 - 綜合總覽 ====================

  const OverviewPage = () => (
    <div className="space-y-8">
      {/* 資產總覽 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="我的美金餘額"
          value={`$${cashBalanceMy.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          isPositive={cashBalanceMy >= 0}
        />
        <MetricCard
          title="爸爸的美金餘額"
          value={`$${cashBalanceDad.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          isPositive={cashBalanceDad >= 0}
        />
        <MetricCard
          title="持股成本"
          value={`$${overallMetrics.totalCost.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={BarChart3}
          isPositive={true}
        />
        <MetricCard
          title="持股市值"
          value={`$${overallMetrics.totalValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={TrendingUp}
          isPositive={true}
        />
      </div>

      {/* 損益概況 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="未實現損益"
          value={`$${overallMetrics.unrealizedGain.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtext={`${overallMetrics.gainLossPercent}%`}
          icon={overallMetrics.unrealizedGain >= 0 ? TrendingUp : TrendingDown}
          isPositive={overallMetrics.unrealizedGain >= 0}
        />
        <MetricCard
          title="已實現損益（合計）"
          value={`$${performanceStatsOverall.totalGain.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtext={`${performanceStatsOverall.totalTransactions} 筆交易`}
          icon={performanceStatsOverall.totalGain >= 0 ? TrendingUp : TrendingDown}
          isPositive={performanceStatsOverall.totalGain >= 0}
        />
      </div>

      {/* 持股概況 */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">全部持股</h2>
        <HoldingsTable data={filteredHoldings} />
      </div>
    </div>
  );

  // ==================== 頁面 - 績效分析 ====================

  const PerformancePage = () => {
    const perfStats = activeTab === 'my' ? performanceStatsMy : activeTab === 'dad' ? performanceStatsDad : performanceStatsOverall;
    const soldRecs = activeTab === 'my' ? soldRecordsMy : activeTab === 'dad' ? soldRecordsDad : [...soldRecordsMy, ...soldRecordsDad];

    return (
      <div className="space-y-8">
        {/* 績效總覽 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="已平倉交易"
            value={perfStats.totalTransactions}
            icon={BarChart3}
            isPositive={true}
          />
          <MetricCard
            title="實現損益"
            value={`$${perfStats.totalGain.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={TrendingUp}
            isPositive={perfStats.totalGain >= 0}
          />
          <MetricCard
            title="勝率"
            value={`${perfStats.winRate}%`}
            icon={TrendingUp}
            isPositive={perfStats.winRate >= 50}
          />
          <MetricCard
            title="平均報酬率"
            value={`${perfStats.avgGainPercent}%`}
            icon={TrendingUp}
            isPositive={perfStats.avgGainPercent >= 0}
          />
        </div>

        {/* 最佳與最差交易 */}
        {perfStats.bestTrade && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-emerald-400 mb-4">最佳交易</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">股票代號</span>
                  <span className="text-white font-bold">
                    {perfStats.bestTrade.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">報酬率</span>
                  <span className="text-emerald-400 font-bold">
                    {perfStats.bestTrade.gainLossPercent}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">獲利</span>
                  <span className="text-emerald-400 font-bold">
                    ${perfStats.bestTrade.gainLoss.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-rose-400 mb-4">最差交易</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">股票代號</span>
                  <span className="text-white font-bold">
                    {perfStats.worstTrade.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">報酬率</span>
                  <span className="text-rose-400 font-bold">
                    {perfStats.worstTrade.gainLossPercent}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">虧損</span>
                  <span className="text-rose-400 font-bold">
                    ${perfStats.worstTrade.gainLoss.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 已平倉交易明細 */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">已平倉交易</h2>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    <th className="px-6 py-4 text-left text-gray-400 font-semibold">時間</th>
                    <th className="px-6 py-4 text-left text-gray-400 font-semibold">代號</th>
                    <th className="px-6 py-4 text-right text-gray-400 font-semibold">
                      股數
                    </th>
                    <th className="px-6 py-4 text-right text-gray-400 font-semibold">成本</th>
                    <th className="px-6 py-4 text-right text-gray-400 font-semibold">
                      成交價
                    </th>
                    <th className="px-6 py-4 text-right text-gray-400 font-semibold">
                      收入
                    </th>
                    <th className="px-6 py-4 text-right text-gray-400 font-semibold">
                      損益
                    </th>
                    <th className="px-6 py-4 text-right text-gray-400 font-semibold">
                      報酬率
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {soldRecs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        尚無已平倉交易
                      </td>
                    </tr>
                  ) : (
                    soldRecs.map((record) => {
                      const isGain = record.gainLoss >= 0;
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-400 text-xs">
                            {record.timestamp}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {record.symbol}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-300">
                            {record.quantity.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-300">
                            ${record.costBasis.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-300">
                            ${record.salePrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-300">
                            ${record.grossProceeds.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-semibold ${
                              isGain ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ${record.gainLoss.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-semibold ${
                              isGain ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {record.gainLossPercent}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 頁面 - 現金管理 ====================

  const CashManagementPage = () => {
    const currentCash = activeTab === 'my' ? cashBalanceMy : activeTab === 'dad' ? cashBalanceDad : cashBalanceMy + cashBalanceDad;
    const currentLogs = activeTab === 'my' ? logsMy : activeTab === 'dad' ? logsDad : [...logsMy, ...logsDad];
    const myValue = myMetrics.totalValue;
    const dadValue = dadMetrics.totalValue;
    const totalValue = myValue + dadValue;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title={activeTab === 'my' ? '我的美金餘額' : activeTab === 'dad' ? "爸爸的美金餘額" : "總美金餘額"}
            value={`$${currentCash.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={DollarSign}
            isPositive={currentCash >= 0}
          />
          <MetricCard
            title={activeTab === 'my' ? '我的持股佔資產比例' : activeTab === 'dad' ? "爸爸的持股佔資產比例" : "持股佔資產比例"}
            value={`${(activeTab === 'my' ? totalAssetsMy : activeTab === 'dad' ? totalAssetsDad : totalAssets) > 0 ? (((activeTab === 'my' ? myValue : activeTab === 'dad' ? dadValue : totalValue) / (activeTab === 'my' ? totalAssetsMy : activeTab === 'dad' ? totalAssetsDad : totalAssets)) * 100).toFixed(1) : 0}%`}
            icon={PieChart}
            isPositive={true}
          />
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">時間</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">類別</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">詳細</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-semibold">金額</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs
                  .filter((log) => log.category.includes('美金'))
                  .length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      目前沒有現金操作記錄
                    </td>
                  </tr>
                ) : (
                  currentLogs
                    .filter((log) => log.category.includes('美金'))
                    .reverse()
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {log.timestamp}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              log.amount > 0
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{log.details}</td>
                        <td
                          className={`px-6 py-4 text-right font-semibold ${
                            log.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {log.amount > 0 ? '+' : ''}
                          ${log.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 頁面 - 交易日誌 ====================

  const LogsPage = () => {
    const currentLogs = activeTab === 'my' ? logsMy : activeTab === 'dad' ? logsDad : [...logsMy, ...logsDad];

    return (
      <div className="space-y-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">時間</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">類別</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">詳細項目</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-semibold">金額</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      目前沒有交易記錄
                    </td>
                  </tr>
                ) : (
                  [...currentLogs].reverse().map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.amount > 0
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{log.details}</td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          log.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {log.amount > 0 ? '+' : ''}
                        ${log.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 主體渲染 ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-x-hidden">
      {/* 背景裝飾 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* 導航欄 */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold">Portfolio</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={syncPrices}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-400 font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                同步現價
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容 */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 頁籤與帳戶篩選 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          {/* 頁籤 */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'overview', label: '綜合總覽' },
              { id: 'my', label: '我的持股' },
              { id: 'dad', label: "爸爸的持股" },
              { id: 'cash', label: '現金管理' },
              { id: 'performance', label: '績效分析' },
              { id: 'logs', label: '交易日誌' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'my') setSelectedAccount('my');
                  else if (tab.id === 'dad') setSelectedAccount('dad');
                  else if (tab.id === 'overview') setSelectedAccount('all');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              買入
            </button>
            <button
              onClick={() => setShowCashModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all"
            >
              <DollarSign className="w-5 h-5" />
              現金
            </button>
          </div>
        </div>

        {/* 頁面內容 */}
        <div className="relative z-0">
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'my' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="我的美金餘額"
                  value={`$${cashBalanceMy.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  icon={DollarSign}
                  isPositive={cashBalanceMy >= 0}
                />
                <MetricCard
                  title="我的持股成本"
                  value={`$${myMetrics.totalCost.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  icon={BarChart3}
                  isPositive={true}
                />
                <MetricCard
                  title="我的持股市值"
                  value={`$${myMetrics.totalValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  icon={TrendingUp}
                  isPositive={true}
                />
                <MetricCard
                  title="我的損益"
                  value={`$${myMetrics.unrealizedGain.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  subtext={`${myMetrics.gainLossPercent}%`}
                  icon={
                    myMetrics.unrealizedGain >= 0 ? TrendingUp : TrendingDown
                  }
                  isPositive={myMetrics.unrealizedGain >= 0}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">我的持股</h2>
                <HoldingsTable
                  data={holdings.filter((h) => h.account === 'my')}
                />
              </div>
            </div>
          )}
          {activeTab === 'dad' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="爸爸的美金餘額"
                  value={`$${cashBalanceDad.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  icon={DollarSign}
                  isPositive={cashBalanceDad >= 0}
                />
                <MetricCard
                  title="爸爸的持股成本"
                  value={`$${dadMetrics.totalCost.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  icon={BarChart3}
                  isPositive={true}
                />
                <MetricCard
                  title="爸爸的持股市值"
                  value={`$${dadMetrics.totalValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  icon={TrendingUp}
                  isPositive={true}
                />
                <MetricCard
                  title="爸爸的損益"
                  value={`$${dadMetrics.unrealizedGain.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  subtext={`${dadMetrics.gainLossPercent}%`}
                  icon={
                    dadMetrics.unrealizedGain >= 0 ? TrendingUp : TrendingDown
                  }
                  isPositive={dadMetrics.unrealizedGain >= 0}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">爸爸的持股</h2>
                <HoldingsTable
                  data={holdings.filter((h) => h.account === 'dad')}
                />
              </div>
            </div>
          )}
          {activeTab === 'cash' && <CashManagementPage />}
          {activeTab === 'performance' && <PerformancePage />}
          {activeTab === 'logs' && <LogsPage />}
        </div>
      </main>

      {/* Modal */}
      <BuyModal
        show={showBuyModal}
        buyForm={buyForm}
        setBuyForm={setBuyForm}
        onClose={() => setShowBuyModal(false)}
        onConfirm={handleBuy}
      />
      <SellModal
        show={showSellModal}
        selectedStock={selectedStock}
        sellForm={sellForm}
        setSellForm={setSellForm}
        onClose={closeSellModal}
        onConfirm={handleSell}
      />
      <CashModal
        show={showCashModal}
        cashForm={cashForm}
        setCashForm={setCashForm}
        onClose={() => setShowCashModal(false)}
        onConfirm={handleCashTransaction}
      />
    </div>
  );
}
