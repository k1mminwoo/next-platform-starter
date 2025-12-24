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
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    // 로딩 시작 (이전 로딩이 끝나지 않았을 수 있으니 강제)
    setLoading(true);
    setError(null);

    let success = false;
    try {
      // Hyperliquid - LIT만 타겟팅해서 가볍게 (allMids 사용, 빠름)
      const hyperRes = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'allMids' }),
      });
      const mids = await hyperRes.json();
      const hlMid = mids['LIT'] ? parseFloat(mids['LIT']) : null;

      // Hyperliquid funding은 별도 호출 (필요 시)
      let hlFund = null;
      try {
        const fundingRes = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'fundingDashboard' }),
        });
        if (fundingRes.ok) {
          const fundingData = await fundingRes.json();
          const litFund = fundingData.find(item => item.asset === 'LIT');
          hlFund = litFund ? parseFloat(litFund.funding) * 100 : null;
        }
      } catch {} // funding 실패해도 가격은 보여줌

      // Binance LITUSDT Perpetual
      let binP = null;
      let binFund = null;
      try {
        const binPriceRes = await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=LITUSDT');
        if (binPriceRes.ok) {
          const json = await binPriceRes.json();
          binP = parseFloat(json.price);
        }

        const binFundRes = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=LITUSDT');
        if (binFundRes.ok) {
          const json = await binFundRes.json();
          binFund = parseFloat(json.lastFundingRate) * 100;
        }
      } catch {} // Binance 실패해도 HL 데이터는 보여줌

      // 계산
      const gap = hlMid && binP ? ((binP - hlMid) / hlMid) * 100 : null;
      if (gap !== null) {
        setHistory(prev => [...prev, gap].slice(-300));
      }

      setHlPrice(hlMid);
      setBinPrice(binP);
      setPremiumGap(gap);
      setHlFunding(hlFund);
      setBinFunding(binFund);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
      success = true;
    } catch (err) {
      setError('일시적 네트워크 오류. 자동 재시도 중...');
      console.error(err);
    } finally {
      // 성공 여부와 상관없이 로딩 끝 (로딩 무한 방지)
      setLoading(false);
    }

    // 성공했으면 다음 갱신 준비, 실패해도 계속 시도
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8초로 여유롭게
    return () => clearInterval(interval);
  }, []);

  // 그래프는 동일

  return (
    // UI는 기존 그대로 (loading ? 'Loading...' : 실제 데이터 or 'N/A')
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 동일 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            LIT ARBITRAGE <span className="text-xs bg-gray-700 px-3 py-1 rounded ml-2">PRO</span>
          </h1>
          <div className="text-sm text-gray-400">
            ZEN | Alert &gt; 1 %
          </div>
        </div>

        <div className="bg-gradient-to-b from-gray-900/50 to-black rounded-3xl border border-gray-800 p-6 md:p-8 shadow-2xl">
          <div className="grid grid-cols-3 gap-4 items-center text-center mb-8">
            <div>
              <div className="text-cyan-400 text-sm mb-2">• HL</div>
              <div className="text-4xl md:text-5xl font-bold">
                {loading ? 'Loading...' : hlPrice !== null ? hlPrice.toFixed(4) : 'N/A'}
              </div>
              <div className="text-green-400 text-sm mt-2">
                Funding {loading ? '...' : hlFunding !== null ? hlFunding.toFixed(4) + '%' : 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-sm mb-3">PREMIUM GAP</div>
              <div className={`text-5xl md:text-6xl font-bold ${premiumGap > 0 ? 'text-green-400' : premiumGap < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {loading ? '...' : premiumGap !== null ? (premiumGap > 0 ? '+' : '') + premiumGap.toFixed(2) + '%' : 'N/A'}
              </div>
              <div className="text-gray-400 text-sm mt-3">SHORT HL / LONG BIN</div>
            </div>

            <div>
              <div className="text-orange-400 text-sm mb-2">BN •</div>
              <div className="text-4xl md:text-5xl font-bold">
                {loading ? 'Loading...' : binPrice !== null ? binPrice.toFixed(4) : 'N/A'}
              </div>
              <div className="text-green-400 text-sm mt-2">
                Funding {loading ? '...' : binFunding !== null ? binFunding.toFixed(4) + '%' : 'N/A'}
              </div>
            </div>
          </div>

          {/* 그래프, 하단 정보, 버튼 동일 */}
          {/* ... 생략 ... */}

        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          Data: 8s refresh | Source: Hyperliquid / Binance
        </p>

        {error && <p className="text-center text-yellow-400 mt-4">{error}</p>}
      </div>
    </div>
  );
}
