'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  // Hyperliquid 지원 주요 코인 (USDT 페어)
  const coins = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'LINK', 'BNB', 'ADA', 'TRX', 'LIT'];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Hyperliquid allMids (mid price) 한 번에 가져오기
      const hyperRes = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'allMids' }),
      });
      const hyperJson = await hyperRes.json();
      const hyperMids = hyperJson; // { "BTC": "71234.5", ... }

      // 2. Binance Spot 여러 코인 가격 한 번에 가져오기
      const usdtPairs = coins.map(coin => `${coin}USDT`);
      const binanceRes = await fetch(
        `https://fapi.binance.com/fapi/v1/ticker/price?symbols=${JSON.stringify(usdtPairs)}`
      );
      const binanceJson = await binanceRes.json(); // 배열

      const binanceMap = {};
      binanceJson.forEach(item => {
        const coin = item.symbol.replace('USDT', '');
        binanceMap[coin] = parseFloat(item.price);
      });

      // 3. 데이터 합치기
      const newData = coins.map(coin => {
        const hyperPrice = hyperMids[coin] ? parseFloat(hyperMids[coin]) : null;
        const binancePrice = binanceMap[coin] || null;

        let diffPercent = null;
        if (binancePrice && hyperPrice && hyperPrice !== 0) {
          diffPercent = ((binancePrice - hyperPrice) / hyperPrice) * 100;
        }

        return {
          symbol: coin,
          binancePrice,
          hyperPrice,
          diffPercent,
        };
      });

      setData(newData);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch (err) {
      setError('가격 정보를 불러오지 못했습니다. 네트워크나 API 확인해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 8000); // 8초마다 갱신
    return () => clearInterval(interval);
  }, []);

  return (
  <div className="min-h-screen bg-black text-white py-8 px-4">  {/* 배경 완전 검정 */}
    <div className="max-w-5xl mx-auto">
      {/* 제목 - 그라데이션 효과 */}
      <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
        Funding & Premium Gap Dashboard
      </h1>
      <p className="text-center text-gray-400 mb-10 text-lg">
        Hyperliquid Perpetual 실시간 데이터 | 업데이트: {lastUpdate}
      </p>

      {error && (
        <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg mb-8">
          {error}
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="text-center text-2xl py-20 text-gray-400">Loading data...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-800 shadow-2xl">  {/* 테이블 외곽 테두리 */}
          <table className="w-full">
            <thead className="bg-gray-900/50">  {/* 헤더 약간 투명 */}
              <tr>
                <th className="p-5 text-left text-sm uppercase tracking-wider text-gray-400">Coin</th>
                <th className="p-5 text-right text-sm uppercase tracking-wider text-gray-400">Mark Price</th>
                <th className="p-5 text-right text-sm uppercase tracking-wider text-gray-400">Open Interest</th>
                <th className="p-5 text-right text-sm uppercase tracking-wider text-gray-400">Funding (%)</th>
                <th className="p-5 text-right text-sm uppercase tracking-wider text-gray-400 font-bold text-yellow-300">Premium Gap (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.coin} className={`border-t border-gray-800 ${index % 2 === 0 ? 'bg-gray-900/20' : ''} hover:bg-gray-800/50 transition`}>
                  <td className="p-5 font-bold text-2xl">{item.coin}</td>
                  <td className="p-5 text-right font-mono text-lg">${item.markPrice}</td>
                  <td className="p-5 text-right font-mono text-lg">${item.openInterest}</td>
                  <td className={`p-5 text-right font-mono text-lg ${parseFloat(item.fundingRate) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.fundingRate}%
                  </td>
                  <td className={`p-5 text-right text-3xl font-bold ${
                    Math.abs(parseFloat(item.premium)) > 0.05
                      ? parseFloat(item.premium) > 0
                        ? 'text-red-400'
                        : 'text-green-400'
                      : 'text-gray-500'
                  }`}>
                    {item.premium}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center mt-12 text-sm text-gray-600">
        Data from Hyperliquid Public API | For reference only
      </p>
    </div>
  </div>
);
}
