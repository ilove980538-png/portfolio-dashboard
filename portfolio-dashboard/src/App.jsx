import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, LogOut, BarChart3, Calendar, RefreshCw, X, DollarSign, PieChart } from 'lucide-react';

// ==================== 儲存工具 ====================
const KEYS = {
  HOLDINGS: 'portfolio_holdings',
  CASH_MY: 'portfolio_cash_my',
  CASH_DAD: 'portfolio_cash_dad',
  LOGS_MY: 'portfolio_logs_my',
  LOGS_DAD: 'portfolio_logs_dad',
  SOLD_MY: 'portfolio_sold_records_my',
  SOLD_DAD: 'portfolio_sold_records_dad',
};
const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const API_KEY = 'd7j38fpr01qp3g1rkso0d7j38fpr01qp3g1rksog';

// ==================== 主應用 ====================
export default function App() {
  const [holdings, setHoldings] = useState(() => load(KEYS.HOLDINGS, []));
  const [cashMy, setCashMy] = useState(() => load(KEYS.CASH_MY, 0));
  const [cashDad, setCashDad] = useState(() => load(KEYS.CASH_DAD, 0));
  const [logsMy, setLogsMy] = useState(() => load(KEYS.LOGS_MY, []));
  const [logsDad, setLogsDad] = useState(() => load(KEYS.LOGS_DAD, []));
  const [soldMy, setSoldMy] = useState(() => load(KEYS.SOLD_MY, []));
  const [soldDad, setSoldDad] = useState(() => load(KEYS.SOLD_DAD, []));
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [sellStock, setSellStock] = useState(null);

  // dialog refs
  const buyDialogRef = useRef();
  const sellDialogRef = useRef();
  const cashDialogRef = useRef();

  // input refs - buy
  const buySymbol = useRef(); const buyPrice = useRef(); const buyQty = useRef();
  const buyFee = useRef(); const buyAccount = useRef();
  // input refs - sell
  const sellQty = useRef(); const sellPrice = useRef(); const sellFee = useRef();
  const sellTypeRef = useRef('all');
  const [sellType, setSellType] = useState('all');
  // input refs - cash
  const cashAmount = useRef(); const cashRemark = useRef();
  const cashTypeRef = useRef('deposit');
  const cashAccountRef = useRef('my');
  const [cashType, setCashType] = useState('deposit');
  const [cashAccount, setCashAccount] = useState('my');

  // persist
  useEffect(() => save(KEYS.HOLDINGS, holdings), [holdings]);
  useEffect(() => save(KEYS.CASH_MY, cashMy), [cashMy]);
  useEffect(() => save(KEYS.CASH_DAD, cashDad), [cashDad]);
  useEffect(() => save(KEYS.LOGS_MY, logsMy), [logsMy]);
  useEffect(() => save(KEYS.LOGS_DAD, logsDad), [logsDad]);
  useEffect(() => save(KEYS.SOLD_MY, soldMy), [soldMy]);
  useEffect(() => save(KEYS.SOLD_DAD, soldDad), [soldDad]);

  // ---- sync prices ----
  const syncPrices = async () => {
    if (holdings.length === 0) return;
    setLoading(true);
    try {
      const updated = await Promise.all(holdings.map(async (h) => {
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${h.symbol}&token=${API_KEY}`);
          const data = await res.json();
          return data.c ? { ...h, currentPrice: data.c } : h;
        } catch { return h; }
      }));
      setHoldings(updated);
    } finally { setLoading(false); }
  };

  // ---- buy ----
  const handleBuy = () => {
    const symbol = (buySymbol.current?.value || '').toUpperCase().trim();
    const price = parseFloat(buyPrice.current?.value || '');
    const qty = parseFloat(buyQty.current?.value || '');
    const fee = parseFloat(buyFee.current?.value || '0') || 0;
    const account = buyAccount.current?.value || 'my';
    if (!symbol || !price || !qty) { alert('請填入完整資訊'); return; }
    const totalCost = price * qty + fee;
    const cash = account === 'my' ? cashMy : cashDad;
    if (cash < totalCost) { alert('現金不足'); return; }
    const idx = holdings.findIndex(h => h.symbol === symbol && h.account === account);
    if (idx >= 0) {
      const ex = holdings[idx];
      const newQty = ex.quantity + qty;
      const newAvg = (ex.avgCost * ex.quantity + totalCost) / newQty;
      const updated = [...holdings];
      updated[idx] = { ...ex, quantity: newQty, avgCost: newAvg, currentPrice: price };
      setHoldings(updated);
    } else {
      setHoldings(prev => [...prev, { id: Date.now(), symbol, quantity: qty, avgCost: price, currentPrice: price, account }]);
    }
    if (account === 'my') { setCashMy(prev => prev - totalCost); setLogsMy(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleString('zh-TW'), category: '股票買入', details: `${symbol} ${qty}股 @ ${price}`, amount: -totalCost }]); }
    else { setCashDad(prev => prev - totalCost); setLogsDad(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleString('zh-TW'), category: '股票買入', details: `${symbol} ${qty}股 @ ${price}`, amount: -totalCost }]); }
    buyDialogRef.current?.close();
    if (buySymbol.current) buySymbol.current.value = '';
    if (buyPrice.current) buyPrice.current.value = '';
    if (buyQty.current) buyQty.current.value = '';
    if (buyFee.current) buyFee.current.value = '0.99';
  };

  // ---- sell ----
  const handleSell = () => {
    if (!sellStock) return;
    const qty = sellType === 'all' ? sellStock.quantity : parseFloat(sellQty.current?.value || '');
    const price = parseFloat(sellPrice.current?.value || '');
    const fee = parseFloat(sellFee.current?.value || '0') || 0;
    if (!qty || !price) { alert('請填入完整資訊'); return; }
    if (qty > sellStock.quantity) { alert('賣出股數超過持股'); return; }
    const gross = qty * price;
    const net = gross - fee;
    const cost = qty * sellStock.avgCost;
    const gain = net - cost;
    const gainPct = cost > 0 ? ((gain / cost) * 100).toFixed(2) : 0;
    const updated = [...holdings];
    const hi = updated.findIndex(h => h.id === sellStock.id);
    if (qty >= sellStock.quantity) updated.splice(hi, 1);
    else updated[hi] = { ...updated[hi], quantity: updated[hi].quantity - qty };
    setHoldings(updated);
    const rec = { id: Date.now(), timestamp: new Date().toLocaleString('zh-TW'), symbol: sellStock.symbol, quantity: qty, avgCost: sellStock.avgCost, salePrice: price, costBasis: cost, grossProceeds: gross, fee, gainLoss: gain, gainLossPercent: gainPct, account: sellStock.account };
    const log = { id: Date.now(), timestamp: new Date().toLocaleString('zh-TW'), category: '股票賣出', details: `${sellStock.symbol} ${qty}股 @ ${price}`, amount: net };
    if (sellStock.account === 'my') { setCashMy(prev => prev + net); setSoldMy(prev => [...prev, rec]); setLogsMy(prev => [...prev, log]); }
    else { setCashDad(prev => prev + net); setSoldDad(prev => [...prev, rec]); setLogsDad(prev => [...prev, log]); }
    sellDialogRef.current?.close();
    setSellStock(null);
  };

  // ---- cash ----
  const handleCash = () => {
    const amount = parseFloat(cashAmount.current?.value || '');
    const remark = cashRemark.current?.value || '';
    if (!amount || amount <= 0) { alert('請輸入有效金額'); return; }
    const txAmount = cashType === 'deposit' ? amount : -amount;
    if (cashType === 'withdraw') {
      if (cashAccount === 'my' && cashMy < amount) { alert('現金不足'); return; }
      if (cashAccount === 'dad' && cashDad < amount) { alert('現金不足'); return; }
    }
    const log = { id: Date.now(), timestamp: new Date().toLocaleString('zh-TW'), category: cashType === 'deposit' ? '現金存入' : '現金提領', details: remark || (cashType === 'deposit' ? '存入' : '提領'), amount: txAmount };
    if (cashAccount === 'my') { setCashMy(prev => prev + txAmount); setLogsMy(prev => [...prev, log]); }
    else { setCashDad(prev => prev + txAmount); setLogsDad(prev => [...prev, log]); }
    cashDialogRef.current?.close();
    if (cashAmount.current) cashAmount.current.value = '';
    if (cashRemark.current) cashRemark.current.value = '';
  };

  // ---- stats ----
  const myHoldings = holdings.filter(h => h.account === 'my');
  const dadHoldings = holdings.filter(h => h.account === 'dad');
  const myCost = myHoldings.reduce((s, h) => s + h.avgCost * h.quantity, 0);
  const myMV = myHoldings.reduce((s, h) => s + h.currentPrice * h.quantity, 0);
  const dadCost = dadHoldings.reduce((s, h) => s + h.avgCost * h.quantity, 0);
  const dadMV = dadHoldings.reduce((s, h) => s + h.currentPrice * h.quantity, 0);
  const myGain = myMV - myCost;
  const dadGain = dadMV - dadCost;
  const myRealGain = soldMy.reduce((s, r) => s + r.gainLoss, 0);
  const dadRealGain = soldDad.reduce((s, r) => s + r.gainLoss, 0);

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtS = (n, prefix = '$') => `${n >= 0 ? '+' : ''}${prefix}${fmt(Math.abs(n))}`;
  const cls = 'bg-white/5 border border-white/10 rounded-xl p-4';
  const iCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50';
  const iStyle = { fontSize: '16px' };

  const HoldingTable = ({ list }) => (
    <div className="overflow-x-auto">
      {list.length === 0 ? <p className="text-gray-500 text-center py-8">尚無持股</p> : (
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 border-b border-white/10">
            <th className="text-left py-2 pr-3">代號</th>
            <th className="text-right py-2 pr-3">股數</th>
            <th className="text-right py-2 pr-3">成本</th>
            <th className="text-right py-2 pr-3">現價</th>
            <th className="text-right py-2 pr-3">市值</th>
            <th className="text-right py-2 pr-3">損益</th>
            <th className="text-right py-2">操作</th>
          </tr></thead>
          <tbody>{list.map(h => {
            const mv = h.currentPrice * h.quantity;
            const cost = h.avgCost * h.quantity;
            const g = mv - cost;
            const gp = cost > 0 ? ((g / cost) * 100).toFixed(1) : 0;
            return (
              <tr key={h.id} className="border-b border-white/5 hover:bg-white/3">
                <td className="py-2 pr-3 font-bold text-white">{h.symbol}</td>
                <td className="text-right py-2 pr-3 text-gray-300">{fmt(h.quantity)}</td>
                <td className="text-right py-2 pr-3 text-gray-300">${fmt(cost)}</td>
                <td className="text-right py-2 pr-3 text-gray-300">${fmt(h.currentPrice)}</td>
                <td className="text-right py-2 pr-3 text-white">${fmt(mv)}</td>
                <td className={`text-right py-2 pr-3 ${g >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{g >= 0 ? '+' : ''}${fmt(g)}<br/><span className="text-xs">({gp}%)</span></td>
                <td className="text-right py-2">
                  <button onClick={() => { setSellStock(h); setSellType('all'); sellDialogRef.current?.showModal(); }} className="bg-rose-500/80 text-white text-xs px-3 py-1 rounded-lg">賣出</button>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#050505', color: 'white' }}>
      {/* Nav */}
      <nav className="border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /><span className="font-bold">Portfolio</span></div>
        <button onClick={syncPrices} disabled={loading} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{loading ? '同步中...' : '同步現價'}
        </button>
      </nav>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/10 px-4">
        {[['overview','總覽'],['my','我的'],['dad','爸爸'],['cash','現金'],['perf','績效'],['logs','日誌']].map(([k,v]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${tab === k ? 'border-emerald-400 text-white' : 'border-transparent text-gray-400'}`}>{v}</button>
        ))}
      </div>

      {/* Content */}
      <main className="p-4 max-w-4xl mx-auto">

        {/* 總覽 */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={cls}><p className="text-gray-400 text-xs mb-1">我的現金</p><p className="text-xl font-bold text-emerald-400">${fmt(cashMy)}</p></div>
              <div className={cls}><p className="text-gray-400 text-xs mb-1">爸爸現金</p><p className="text-xl font-bold text-emerald-400">${fmt(cashDad)}</p></div>
              <div className={cls}><p className="text-gray-400 text-xs mb-1">我的市值</p><p className="text-xl font-bold text-white">${fmt(myMV)}</p><p className={`text-sm ${myGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{myGain >= 0 ? '+' : ''}${fmt(myGain)}</p></div>
              <div className={cls}><p className="text-gray-400 text-xs mb-1">爸爸市值</p><p className="text-xl font-bold text-white">${fmt(dadMV)}</p><p className={`text-sm ${dadGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{dadGain >= 0 ? '+' : ''}${fmt(dadGain)}</p></div>
              <div className={cls}><p className="text-gray-400 text-xs mb-1">我的已實現</p><p className={`text-xl font-bold ${myRealGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{myRealGain >= 0 ? '+' : ''}${fmt(myRealGain)}</p></div>
              <div className={cls}><p className="text-gray-400 text-xs mb-1">爸爸已實現</p><p className={`text-xl font-bold ${dadRealGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{dadRealGain >= 0 ? '+' : ''}${fmt(dadRealGain)}</p></div>
            </div>
          </div>
        )}

        {/* 我的持股 */}
        {tab === 'my' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-400 text-sm">我的現金</p><p className="text-2xl font-bold text-emerald-400">${fmt(cashMy)}</p></div>
              <button onClick={() => buyDialogRef.current?.showModal()} className="flex items-center gap-2 bg-emerald-500/80 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="w-4 h-4" />買入
              </button>
            </div>
            <HoldingTable list={myHoldings} />
          </div>
        )}

        {/* 爸爸持股 */}
        {tab === 'dad' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-400 text-sm">爸爸現金</p><p className="text-2xl font-bold text-emerald-400">${fmt(cashDad)}</p></div>
              <button onClick={() => buyDialogRef.current?.showModal()} className="flex items-center gap-2 bg-emerald-500/80 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="w-4 h-4" />買入
              </button>
            </div>
            <HoldingTable list={dadHoldings} />
          </div>
        )}

        {/* 現金管理 */}
        {tab === 'cash' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={cls}><p className="text-gray-400 text-xs">我的現金</p><p className="text-xl font-bold text-emerald-400">${fmt(cashMy)}</p></div>
              <div className={cls}><p className="text-gray-400 text-xs">爸爸現金</p><p className="text-xl font-bold text-emerald-400">${fmt(cashDad)}</p></div>
            </div>
            <button onClick={() => cashDialogRef.current?.showModal()} className="w-full flex items-center justify-center gap-2 bg-blue-500/80 hover:bg-blue-500 text-white py-3 rounded-lg font-medium">
              <DollarSign className="w-4 h-4" />存入 / 提領
            </button>
            <div className="space-y-2">
              {[...logsMy.filter(l => l.category.includes('現金')).map(l => ({ ...l, who: '我的' })), ...logsDad.filter(l => l.category.includes('現金')).map(l => ({ ...l, who: '爸爸' }))]
                .sort((a, b) => b.id - a.id).map(l => (
                  <div key={l.id} className={`${cls} flex items-center justify-between`}>
                    <div><p className="text-white text-sm">{l.who} - {l.category}</p><p className="text-gray-400 text-xs">{l.timestamp} {l.details && `· ${l.details}`}</p></div>
                    <p className={`font-bold ${l.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{l.amount >= 0 ? '+' : ''}${fmt(Math.abs(l.amount))}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 績效 */}
        {tab === 'perf' && (
          <div className="space-y-4">
            {[['我的', soldMy], ['爸爸', soldDad]].map(([name, sold]) => {
              const wins = sold.filter(r => r.gainLoss > 0).length;
              const rate = sold.length > 0 ? ((wins / sold.length) * 100).toFixed(0) : 0;
              const avg = sold.length > 0 ? (sold.reduce((s, r) => s + parseFloat(r.gainLossPercent), 0) / sold.length).toFixed(2) : 0;
              return (
                <div key={name} className="space-y-3">
                  <h3 className="text-lg font-bold text-white">{name}的績效</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={cls}><p className="text-gray-400 text-xs">勝率</p><p className="text-2xl font-bold text-emerald-400">{rate}%</p></div>
                    <div className={cls}><p className="text-gray-400 text-xs">平均報酬</p><p className={`text-2xl font-bold ${avg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{avg}%</p></div>
                  </div>
                  {sold.length === 0 ? <p className="text-gray-500 text-center py-4">尚無已平倉交易</p> : (
                    <div className="space-y-2">{sold.slice().reverse().map(r => (
                      <div key={r.id} className={`${cls} flex items-center justify-between`}>
                        <div><p className="text-white text-sm font-bold">{r.symbol}</p><p className="text-gray-400 text-xs">{r.timestamp}</p></div>
                        <p className={`font-bold ${r.gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{r.gainLoss >= 0 ? '+' : ''}${fmt(r.gainLoss)} ({r.gainLossPercent}%)</p>
                      </div>
                    ))}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 日誌 */}
        {tab === 'logs' && (
          <div className="space-y-2">
            {[...logsMy.map(l => ({ ...l, who: '我的' })), ...logsDad.map(l => ({ ...l, who: '爸爸' }))]
              .sort((a, b) => b.id - a.id).map(l => (
                <div key={l.id} className={`${cls} flex items-center justify-between`}>
                  <div><p className="text-white text-sm">{l.who} - {l.category}</p><p className="text-gray-400 text-xs">{l.timestamp} · {l.details}</p></div>
                  <p className={`font-bold text-sm ${l.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{l.amount >= 0 ? '+' : ''}${fmt(Math.abs(l.amount))}</p>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* ===== 買入 Dialog ===== */}
      <dialog ref={buyDialogRef} style={{ background: 'transparent', border: 'none', padding: '16px', width: '100%', maxWidth: '480px' }}>
        <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">買入股票</h2>
            <button onClick={() => buyDialogRef.current?.close()} className="text-gray-400"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div><label className="block text-sm text-gray-400 mb-1">股票代號</label>
              <input ref={buySymbol} type="text" placeholder="例: TSLA" className={iCls} style={{ ...iStyle, textTransform: 'uppercase' }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-400 mb-1">買入價格</label>
                <input ref={buyPrice} type="text" inputMode="decimal" placeholder="0.00" className={iCls} style={iStyle} /></div>
              <div><label className="block text-sm text-gray-400 mb-1">股數</label>
                <input ref={buyQty} type="text" inputMode="decimal" placeholder="0" className={iCls} style={iStyle} /></div>
            </div>
            <div><label className="block text-sm text-gray-400 mb-1">手續費</label>
              <input ref={buyFee} type="text" inputMode="decimal" placeholder="0.99" defaultValue="0.99" className={iCls} style={iStyle} /></div>
            <div><label className="block text-sm text-gray-400 mb-1">帳戶</label>
              <select ref={buyAccount} className={iCls} style={iStyle}>
                <option value="my">我的帳戶</option>
                <option value="dad">爸爸的帳戶</option>
              </select></div>
            <button onClick={handleBuy} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-lg mt-2">確認買入</button>
          </div>
        </div>
      </dialog>

      {/* ===== 賣出 Dialog ===== */}
      <dialog ref={sellDialogRef} style={{ background: 'transparent', border: 'none', padding: '16px', width: '100%', maxWidth: '480px' }}>
        <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">賣出 {sellStock?.symbol}</h2>
            <button onClick={() => { sellDialogRef.current?.close(); setSellStock(null); }} className="text-gray-400"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
              <p className="text-gray-400 text-sm">持股數量</p>
              <p className="text-2xl font-bold text-white">{fmt(sellStock?.quantity || 0)}</p>
            </div>
            <div><label className="block text-sm text-gray-400 mb-2">賣出方式</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input type="radio" checked={sellType === 'all'} onChange={() => setSellType('all')} /> 全數出清
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input type="radio" checked={sellType === 'partial'} onChange={() => setSellType('partial')} /> 部分賣出
                </label>
              </div>
            </div>
            {sellType === 'partial' && (
              <div><label className="block text-sm text-gray-400 mb-1">賣出股數</label>
                <input ref={sellQty} type="text" inputMode="decimal" placeholder="0" className={iCls} style={{ ...iStyle, borderColor: 'rgba(244,63,94,0.3)' }} /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-400 mb-1">成交價</label>
                <input ref={sellPrice} type="text" inputMode="decimal" placeholder="0.00" className={iCls} style={{ ...iStyle, borderColor: 'rgba(244,63,94,0.3)' }} /></div>
              <div><label className="block text-sm text-gray-400 mb-1">手續費</label>
                <input ref={sellFee} type="text" inputMode="decimal" placeholder="0.99" defaultValue="0.99" className={iCls} style={{ ...iStyle, borderColor: 'rgba(244,63,94,0.3)' }} /></div>
            </div>
            <button onClick={handleSell} className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-3 rounded-lg mt-2">確認賣出</button>
          </div>
        </div>
      </dialog>

      {/* ===== 現金 Dialog ===== */}
      <dialog ref={cashDialogRef} style={{ background: 'transparent', border: 'none', padding: '16px', width: '100%', maxWidth: '480px' }}>
        <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">現金操作</h2>
            <button onClick={() => cashDialogRef.current?.close()} className="text-gray-400"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div><label className="block text-sm text-gray-400 mb-1">帳戶</label>
              <select value={cashAccount} onChange={e => setCashAccount(e.target.value)} className={iCls} style={iStyle}>
                <option value="my">我的帳戶</option>
                <option value="dad">爸爸的帳戶</option>
              </select></div>
            <div><label className="block text-sm text-gray-400 mb-2">操作類型</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input type="radio" checked={cashType === 'deposit'} onChange={() => setCashType('deposit')} /> 存入
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input type="radio" checked={cashType === 'withdraw'} onChange={() => setCashType('withdraw')} /> 提領
                </label>
              </div>
            </div>
            <div><label className="block text-sm text-gray-400 mb-1">金額</label>
              <input ref={cashAmount} type="text" inputMode="decimal" placeholder="0.00" className={iCls} style={iStyle} /></div>
            <div><label className="block text-sm text-gray-400 mb-1">備註（選填）</label>
              <input ref={cashRemark} type="text" placeholder="備註" className={iCls} style={iStyle} /></div>
            <button onClick={handleCash} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-lg mt-2">確認</button>
          </div>
        </div>
      </dialog>

    </div>
  );
}
