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
      // Hyperliquid LIT 데이터 (allMids + funding)
      const hyperRes = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'allMids' }),
      });
      const mids = await hyperRes.json();
      const hlMid = mids['LIT'] ? parseFloat(mids['LIT']) : null;

      const fundingRes = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'fundingDashboard' }),
      });
      const fundingData = await fundingRes.json();
      const litFundingItem = fundingData.find(item => item.asset === 'LIT');
      const hlFundRate = litFundingItem ? parseFloat(litFundingItem.funding) * 100 : null; // %로 변환

      // Binance LITUSDT Perpetual 가격 + 펀딩비
      const binPriceRes = await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=LITUSDT');
      const binPriceJson = await binPriceRes.json();
      const binP = parseFloat(binPriceJson.price);

      const binFundingRes = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=LITUSDT');
      const binFundingJson = await binFundingRes.json();
      const binFundRate = parseFloat(binFundingJson.lastFundingRate) * 100;

      // 계산
      const gap = hlMid && binP ? ((binP - hlMid) / hlMid) * 100 : null;

      // 히스토리 업데이트 (최대 200포인트)
      setHistory(prev => {
        const newPoint = gap !== null ? gap.toFixed(4) : null;
        const newHistory = [...prev, newPoint].slice(-200);
        return newHistory;
      });

      setHlPrice(hlMid);
      setBinPrice(binP);
      setPremiumGap(gap);
      setHlFunding(hlFundRate);
      setBinFunding(binFundRate);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8초 갱신
    return () => clearInterval(interval);
  }, []);

  // 간단한 라인 그래프 SVG (히스토리 데이터로 그림)
  const Graph = () => {
    if (history.length < 2) return <div className="h-32 bg-gray-900/50 rounded"></div>;

    const min = Math.min(...history.filter(v => v !== null));
    const max = Math.max(...history.filter(v => v !== null));
    const range = max - min || 1;
    const points = history.map((val, i) => {
      if (val === null) return '';
      const x = (i / (history.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    }).filter(p => p).join(' ');

    return (
      <svg className="w-full h-32" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline fill="none" stroke="#00ffaa" strokeWidth="2" points={points} />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto p-4">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">LIT ARBITRAGE <span className="text-xs bg-gray-700 px-2 py-1 rounded">PRO</span></h1>
          <div className="text-right text-sm text-gray-400">
            ZEN | Alert &gt; 1 %
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 items-center text-center">
            {/* Hyperliquid */}
            <div>
              <div className="text-cyan-400 text-sm mb-1">HL</div>
              <div className="text-4xl font-bold">
                {loading ? '-' : hlPrice ? hlPrice.toFixed(4) : '-'}
              </div>
              <div className="text-green-400 text-sm mt-1">
                Funding {loading ? '-' : hlFunding ? hlFunding.toFixed(4) + '%' : '-'}
              </div>
            </div>

            {/* Premium Gap */}
            <div>
              <div className="text-gray-400 text-sm mb-2">PREMIUM GAP</div>
              <div className={`text-5xl font-bold ${premiumGap > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {loading ? '-' : premiumGap !== null ? (premiumGap > 0 ? '+' : '') + premiumGap.toFixed(2) + '%' : '-'}
              </div>
              <div className="text-gray-400 text-sm mt-2">SHORT HL / LONG BIN</div>
            </div>

            {/* Binance */}
            <div>
              <div className="text-orange-400 text-sm mb-1">BN</div>
              <div className="text-4xl font-bold">
                {loading ? '-' : binPrice ? binPrice.toFixed(4) : '-'}
              </div>
              <div className="text-green-400 text-sm mt-1">
                Funding {loading ? '-' : binFunding ? binFunding.toFixed(4) + '%' : '-'}
              </div>
            </div>
          </div>

          {/* 히스토리 그래프 */}
          <div className="mt-8">
            <div className="text-gray-400 text-sm mb-2">History (200 pts)</div>
            <div className="bg-gray-900/50 rounded-lg overflow-hidden">
              <Graph />
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="grid grid-cols-3 gap-4 mt-8 text-center">
            <div>
              <div className="text-orange-400 text-sm">POINT</div>
              <div className="text-xl font-bold">LIT (HL) x 20</div>
            </div>
            <div>
              <div className="text-4xl font-bold">$68.33</div>
              <div className="text-cyan-400 text-sm">APR Yield Diff</div>
            </div>
            <div>
              <div className="text-xl font-bold">0.61%</div>
            </div>
          </div>
        </div>

        {/* 계산기 버튼 */}
        <div className="text-center">
          <button className="bg-gray-800 hover:bg-gray-700 px-12 py-4 rounded-full text-xl font-semibold transition">
            OPEN CALCULATOR
          </button>
        </div>

        {/* 푸터 */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Data: 3s refresh | Source: Hyperliquid / Binance
        </p>
      </div>
    </div>
  );
}
