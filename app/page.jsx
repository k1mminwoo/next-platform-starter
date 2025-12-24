'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  const [hlPrice, setHlPrice] = useState(null);
  const [binPrice, setBinPrice] = useState(null);
  const [premiumGap, setPremiumGap] = useState(null);
  const [hlFunding, setHlFunding] = useState(null);
  const [binFunding, setBinFunding] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Hyperliquid LIT 데이터
      const hyperRes = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      });
      const hyperJson = await hyperRes.json();
      const perpData = hyperJson[1] || [];
      const litItem = perpData.find(item => item.universe.name === 'LIT');
      const hlMid = litItem ? parseFloat(litItem.markPx) : null;
      const hlFund = litItem ? parseFloat(litItem.funding) * 100 : null;

      // Binance LITUSDT Perpetual 가격 + 펀딩
      const binPriceRes = await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=LITUSDT');
      const binPriceJson = await binPriceRes.json();
      const binP = parseFloat(binPriceJson.price);

      const binFundingRes = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=LITUSDT');
      const binFundingJson = await binFundingRes.json();
      const binFund = parseFloat(binFundingJson.lastFundingRate) * 100;

      // Premium Gap 계산 (BN - HL) / HL * 100
      const gap = hlMid && binP ? ((binP - hlMid) / hlMid) * 100 : null;

      // 히스토리 업데이트 (최대 300포인트)
      if (gap !== null) {
        setHistory(prev => [...prev, gap].slice(-300));
      }

      setHlPrice(hlMid);
      setBinPrice(binP);
      setPremiumGap(gap);
      setHlFunding(hlFund);
      setBinFunding(binFund);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // 5초 갱신 (사진처럼 빠르게)
    return () => clearInterval(interval);
  }, []);

  // 히스토리 그래프 SVG
  const HistoryGraph = () => {
    if (history.length < 2) return <div className="h-40 bg-gray-900/30 rounded-lg"></div>;

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const points = history.map((val, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 90 - ((val - min) / range) * 80;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline fill="none" stroke="#00ffaa" strokeWidth="2" points={points} />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            LIT ARBITRAGE <span className="text-xs bg-gray-700 px-3 py-1 rounded ml-2">PRO</span>
          </h1>
          <div className="text-sm text-gray-400">
            ZEN | Alert &gt; 1 %
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-gradient-to-b from-gray-900/50 to-black rounded-3xl border border-gray-800 p-6 md:p-8 shadow-2xl">
          <div className="grid grid-cols-3 gap-4 items-center text-center mb-8">
            {/* HL */}
            <div>
              <div className="text-cyan-400 text-sm mb-2">• HL</div>
              <div className="text-4xl md:text-5xl font-bold">
                {loading ? '-' : hlPrice ? hlPrice.toFixed(4) : '-'}
              </div>
              <div className="text-green-400 text-sm mt-2">
                Funding {loading ? '-' : hlFunding ? hlFunding.toFixed(4) + '%' : '-'}
              </div>
            </div>

            {/* Premium Gap */}
            <div>
              <div className="text-gray-400 text-sm mb-3">PREMIUM GAP</div>
              <div className={`text-5xl md:text-6xl font-bold ${premiumGap > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {loading ? '-' : premiumGap !== null ? (premiumGap > 0 ? '+' : '') + premiumGap.toFixed(2) + '%' : '-'}
              </div>
              <div className="text-gray-400 text-sm mt-3">SHORT HL / LONG BIN</div>
            </div>

            {/* BN */}
            <div>
              <div className="text-orange-400 text-sm mb-2">BN •</div>
              <div className="text-4xl md:text-5xl font-bold">
                {loading ? '-' : binPrice ? binPrice.toFixed(4) : '-'}
              </div>
              <div className="text-green-400 text-sm mt-2">
                Funding {loading ? '-' : binFunding ? binFunding.toFixed(4) + '%' : '-'}
              </div>
            </div>
          </div>

          {/* 히스토리 그래프 */}
          <div className="mb-8">
            <div className="text-gray-400 text-sm mb-2">History (300 pts)</div>
            <div className="bg-gray-900/30 rounded-lg overflow-hidden">
              <HistoryGraph />
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="grid grid-cols-3 gap-4 text-center mb-8">
            <div>
              <div className="text-orange-400 text-sm">POINT</div>
              <div className="text-2xl font-bold">LIT (HL) x 20</div>
            </div>
            <div>
              <div className="text-5xl font-bold">$68.34</div>
              <div className="text-cyan-400 text-sm">APR Yield Diff</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0.49%</div>
            </div>
          </div>

          {/* 계산기 버튼 */}
          <div className="text-center">
            <button className="bg-gray-800 hover:bg-gray-700 px-16 py-4 rounded-full text-xl font-semibold transition">
              OPEN CALCULATOR
            </button>
          </div>
        </div>

        {/* 푸터 */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Data: 5s refresh | Source: Hyperliquid / Binance
        </p>
      </div>
    </div>
  );
}
