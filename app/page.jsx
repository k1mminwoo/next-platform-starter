'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Hyperliquid fundingDashboard 직접 호출
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'fundingDashboard' }),
      });

      if (!response.ok) throw new Error('API 응답 오류');

      const result = await response.json();

      // Premium Gap 큰 순으로 정렬
      const sortedData = result
        .map(item => ({
          coin: item.asset,
          markPrice: parseFloat(item.markPx).toFixed(4),
          openInterest: Math.round(parseFloat(item.openInterest)).toLocaleString(),
          fundingRate: (parseFloat(item.funding) * 100).toFixed(4),
          premium: item.premium ? (parseFloat(item.premium) * 100).toFixed(4) : '0.0000',
        }))
        .sort((a, b) => Math.abs(parseFloat(b.premium)) - Math.abs(parseFloat(a.premium)));

      setData(sortedData);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch (err) {
      setError('데이터 불러오기 실패: ' + err.message + '. API 변경됐을 수 있어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10초 갱신
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
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
          <div className="text-center text-2xl py-20 text-gray-400">데이터 불러오는 중...</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-800 shadow-2xl">
            <table className="w-full">
              <thead className="bg-gray-900/50">
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
                    <td className={`p-5 text-right text-3xl font-bold ${Math.abs(parseFloat(item.premium)) > 0.05 ? parseFloat(item.premium) > 0 ? 'text-red-400' : 'text-green-400' : 'text-gray-500'}`}>
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
