'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  // Hyperliquid에서 지원하는 주요 퍼페추얼 코인들
  const coins = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'LINK', 'BNB', 'ADA', 'TRX'];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);

    try {
      // Hyperliquid: allMids 한 번에 가져오기
      const hyperRes = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'allMids' }),
      });
      const hyperJson = await hyperRes.json();
      const hyperMids = hyperJson; // { "BTC": "71234.5", ... }

      // Binance: 여러 코인 가격 한 번에 가져오기
      const symbols = coins.map(coin => `${coin}USDT`);
      const binanceRes = await fetch(
        `https://fapi.binance.com/fapi/v1/ticker/price?symbols=${JSON.stringify(symbols)}`
      );
      const binanceJson = await binanceRes.json();

      const binanceMap = {};
      binanceJson.forEach(item => {
        const coin = item.symbol.replace('USDT', '');
        binanceMap[coin] = parseFloat(item.price);
      });

      // 데이터 합치기
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
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError('가격 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
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
    <div className="min-h-screen bg-gray-950 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4">
          Binance ↔ Hyperliquid 아비트라지 대시보드
        </h1>
        <p className="text-center text-gray-400 mb-10 text-lg">
          퍼페추얼 선물 실시간 가격 비교 | {lastUpdate && `최종 업데이트: ${lastUpdate}`}
        </p>

        {error && (
          <div className="text-center text-red-400 mb-8 p-4 bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="text-center text-2xl py-20">가격 불러오는 중...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-purple-900 to-indigo-900">
                <tr>
                  <th className="p-6 text-lg font-semibold">코인</th>
                  <th className="p-6 text-lg font-semibold text-right">Binance</th>
                  <th className="p-6 text-lg font-semibold text-right">Hyperliquid</th>
                  <th className="p-6 text-lg font-semibold text-right">차이 (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.symbol} className="border-b border-gray-800 hover:bg-gray-900 transition">
                    <td className="p-6 font-bold text-xl">{item.symbol}/USDT</td>
                    <td className="p-6 text-right font-mono">
                      {item.binancePrice ? `$${item.binancePrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-6 text-right font-mono">
                      {item.hyperPrice ? `$${item.hyperPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className={`p-6 text-right text-xl font-bold ${
                      item.diffPercent && Math.abs(item.diffPercent) >= 0.3
                        ? item.diffPercent > 0
                          ? 'text-red-400'
                          : 'text-green-400'
                        : 'text-gray-500'
                    }`}>
                      {item.diffPercent !== null ? `${item.diffPercent.toFixed(2)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-center mt-12 text-sm text-gray-500">
          참고용 데이터입니다. 실제 거래는 본인 책임 하에 진행해주세요.
        </p>
      </div>
    </div>
  );
}
